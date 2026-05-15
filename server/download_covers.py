import requests
import json
import os

media_dir = os.path.join(os.path.dirname(__file__), 'media')
os.makedirs(media_dir, exist_ok=True)

headers = {
    'User-Agent': 'PhotoLabGalleryTest/1.0 (test@example.com)'
}

def get_wiki_image(title, filename):
    url = f"https://en.wikipedia.org/w/api.php?action=query&titles={title}&prop=pageimages&format=json&pithumbsize=600"
    res = requests.get(url, headers=headers).json()
    pages = res['query']['pages']
    for page_id in pages:
        if 'thumbnail' in pages[page_id]:
            img_url = pages[page_id]['thumbnail']['source']
            img_data = requests.get(img_url, headers=headers).content
            with open(os.path.join(media_dir, filename), 'wb') as f:
                f.write(img_data)
            print(f"Downloaded {filename}")
            return True
    print(f"Failed to find {title}")
    return False

get_wiki_image('Star_Wars_(film)', 'starwars.jpg')
get_wiki_image('The_Empire_Strikes_Back', 'empire.jpg')
get_wiki_image('Once_Upon_a_Time_in_America', 'once_upon.jpg')
get_wiki_image('Citizen_Kane', 'citizen_kane.jpg')
