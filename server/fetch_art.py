import requests
import json
import os
import time

# Met Museum Object IDs
# 436528 (Van Gogh, Sunflowers/Cypresses)
# 436535 (Van Gogh, Wheat Field)
# 436947 (Monet)
# 436965 (Monet, Water Lilies)
# 437881 (Vermeer, Young Woman)
# 436140 (Degas, Dance Class)
# 437397 (Rembrandt)
# 435882 (Cezanne)
# 436121 (Degas)
# 436530 (Van Gogh, Peasant Woman)

ids = [436528, 436535, 436947, 436965, 437881, 436140, 437397, 435882, 436121, 436530, 438815, 436896]
media_dir = os.path.join(os.path.dirname(__file__), 'media')

os.makedirs(media_dir, exist_ok=True)

photos = []
persons = {} # id -> person
appearances = []

person_id_counter = 1
photo_id_counter = 1

for obj_id in ids:
    try:
        url = f"https://collectionapi.metmuseum.org/public/collection/v1/objects/{obj_id}"
        resp = requests.get(url).json()
        
        title = resp.get('title')
        artist = resp.get('artistDisplayName', 'Unknown Artist')
        artist_bio = resp.get('artistDisplayBio', '')
        country = resp.get('culture', '') or resp.get('artistNationality', 'Unknown')
        year_str = resp.get('objectDate', '2000')
        img_url = resp.get('primaryImageSmall')
        
        if not img_url:
            continue
            
        print(f"Downloading {title} by {artist}...")
        
        # Download image
        img_data = requests.get(img_url).content
        filename = f"art_{obj_id}.jpg"
        with open(os.path.join(media_dir, filename), 'wb') as f:
            f.write(img_data)
            
        # Extract year
        year = 2000
        import re
        m = re.search(r'\d{4}', year_str)
        if m:
            year = int(m.group(0))
            
        # Parse artist name
        parts = artist.split(' ')
        last_name = parts[-1] if len(parts) > 1 else artist
        first_name = " ".join(parts[:-1]) if len(parts) > 1 else ""
        if not first_name:
            first_name = "Unknown"
            
        # Find or create person
        artist_key = f"{first_name} {last_name}"
        if artist_key not in persons:
            persons[artist_key] = {
                'id': person_id_counter,
                'FirstName': first_name,
                'LastName': last_name,
                'Country': country if country else 'Unknown'
            }
            person_id_counter += 1
            
        pid = persons[artist_key]['id']
        
        photos.append({
            'PhotoID': photo_id_counter,
            'Title': title,
            'Description': artist_bio[:200] if artist_bio else f"A masterpiece by {artist}",
            'MediaType': 'photo',
            'Country': country if country else 'Unknown',
            'Year': year,
            'Thumbnail': f"/media/{filename}"
        })
        
        appearances.append({
            'PhotoID': photo_id_counter,
            'PersonID': pid
        })
        
        photo_id_counter += 1
        time.sleep(0.5)
    except Exception as e:
        print(f"Failed on {obj_id}: {e}")

# Generate JS code to replace seedData in db.cjs
js_code = """
  // ── Persons ──
  const persons = [
"""
for p in persons.values():
    fn = p['FirstName'].replace("'", "\\'")
    ln = p['LastName'].replace("'", "\\'")
    co = p['Country'].replace("'", "\\'")
    js_code += f"    {{ FirstName: '{fn}', LastName: '{ln}', Country: '{co}' }},\n"

js_code += """  ];

  const insertPerson = db.prepare(
    'INSERT INTO Person (FirstName, LastName, Country) VALUES (?, ?, ?)'
  );
  for (const p of persons) {
    insertPerson.run(p.FirstName, p.LastName, p.Country);
  }

  // ── Photos / Videos / Audios ──
  const photos = [
"""
for p in photos:
    desc = p['Description'].replace("'", "\\'").replace("\n", " ")
    ti = p['Title'].replace("'", "\\'")
    co = p['Country'].replace("'", "\\'")
    js_code += f"    {{ Title: '{ti}', Description: '{desc}', MediaType: '{p['MediaType']}', Country: '{co}', Year: {p['Year']}, Thumbnail: '{p['Thumbnail']}' }},\n"

js_code += """  ];

  const insertPhoto = db.prepare(
    'INSERT INTO Photo (Title, Description, MediaType, Country, Year, ThumbnailURL, FullURL) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );
  for (const p of photos) {
    insertPhoto.run(p.Title, p.Description, p.MediaType, p.Country, p.Year, p.Thumbnail, p.Thumbnail);
  }

  // ── Appearances (linking people to photos) ──
  const appearances = [
"""
for a in appearances:
    js_code += f"    {{ PhotoID: {a['PhotoID']}, PersonID: {a['PersonID']} }},\n"

js_code += """  ];

  const insertAppearance = db.prepare(
    'INSERT INTO Appearance (PhotoID, PersonID) VALUES (?, ?)'
  );
  for (const a of appearances) {
    insertAppearance.run(a.PhotoID, a.PersonID);
  }
"""

with open(os.path.join(os.path.dirname(__file__), 'seed_data.js'), 'w', encoding='utf-8') as f:
    f.write(js_code)
    
print("Successfully generated seed_data.js and downloaded media.")
