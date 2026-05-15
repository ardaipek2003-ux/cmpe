import requests
from bs4 import BeautifulSoup
import os

media_dir = os.path.join(os.path.dirname(__file__), 'media')
os.makedirs(media_dir, exist_ok=True)
headers = {'User-Agent': 'Mozilla/5.0'}

def get_wiki_infobox_img(title, filename):
    url = f"https://en.wikipedia.org/wiki/{title}"
    res = requests.get(url, headers=headers)
    if res.status_code == 200:
        soup = BeautifulSoup(res.text, 'html.parser')
        infobox = soup.find('table', class_='infobox')
        if infobox:
            img = infobox.find('img')
            if img:
                src = img['src']
                if src.startswith('//'):
                    src = 'https:' + src
                # The image src is a thumbnail, let's get the original by stripping /thumb/ and the last segment
                if '/thumb/' in src:
                    src = src.replace('/thumb', '')
                    src = src.rsplit('/', 1)[0]
                img_data = requests.get(src, headers=headers).content
                with open(os.path.join(media_dir, filename), 'wb') as f:
                    f.write(img_data)
                print(f"Downloaded {filename}")
                return True
    print(f"Failed {title}")
    return False

get_wiki_infobox_img('Star_Wars_(film)', 'starwars.jpg')
get_wiki_infobox_img('The_Empire_Strikes_Back', 'empire.jpg')
get_wiki_infobox_img('Once_Upon_a_Time_in_America', 'once_upon.jpg')
get_wiki_infobox_img('Citizen_Kane', 'citizen_kane.jpg')
get_wiki_infobox_img('Appetite_for_Destruction', 'gnr.jpg')
get_wiki_infobox_img('Led_Zeppelin_IV', 'ledzep.jpg')
get_wiki_infobox_img('Herbert_von_Karajan', 'berlin.jpg')
