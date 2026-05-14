
  // ── Persons ──
  const persons = [
    { FirstName: 'Vincent van', LastName: 'Gogh', Country: 'Dutch' },
    { FirstName: 'Edouard', LastName: 'Manet', Country: 'French' },
    { FirstName: 'Johannes', LastName: 'Vermeer', Country: 'Dutch' },
    { FirstName: 'Edgar', LastName: 'Degas', Country: 'French' },
    { FirstName: 'Rembrandt (Rembrandt van', LastName: 'Rijn)', Country: 'Dutch' },
    { FirstName: 'Paul', LastName: 'Cézanne', Country: 'French' },
    { FirstName: 'Auguste', LastName: 'Renoir', Country: 'French' },
    { FirstName: 'Fra Filippo', LastName: 'Lippi', Country: 'Italian' },
  ];

  const insertPerson = db.prepare(
    'INSERT INTO Person (FirstName, LastName, Country) VALUES (?, ?, ?)'
  );
  for (const p of persons) {
    insertPerson.run(p.FirstName, p.LastName, p.Country);
  }

  // ── Photos / Videos / Audios ──
  const photos = [
    { Title: 'Irises', Description: 'Dutch, Zundert 1853–1890 Auvers-sur-Oise', MediaType: 'photo', Country: 'Dutch', Year: 1890, Thumbnail: '/media/art_436528.jpg' },
    { Title: 'Wheat Field with Cypresses', Description: 'Dutch, Zundert 1853–1890 Auvers-sur-Oise', MediaType: 'photo', Country: 'Dutch', Year: 1889, Thumbnail: '/media/art_436535.jpg' },
    { Title: 'Boating', Description: 'French, Paris 1832–1883 Paris', MediaType: 'photo', Country: 'French', Year: 1874, Thumbnail: '/media/art_436947.jpg' },
    { Title: 'The Monet Family in Their Garden at Argenteuil', Description: 'French, Paris 1832–1883 Paris', MediaType: 'photo', Country: 'French', Year: 1874, Thumbnail: '/media/art_436965.jpg' },
    { Title: 'Young Woman with a Water Pitcher', Description: 'Dutch, Delft 1632–1675 Delft', MediaType: 'photo', Country: 'Dutch', Year: 1662, Thumbnail: '/media/art_437881.jpg' },
    { Title: 'Dancers, Pink and Green', Description: 'French, Paris 1834–1917 Paris', MediaType: 'photo', Country: 'French', Year: 1890, Thumbnail: '/media/art_436140.jpg' },
    { Title: 'Self-Portrait', Description: 'Dutch, Leiden 1606–1669 Amsterdam', MediaType: 'photo', Country: 'Dutch', Year: 1660, Thumbnail: '/media/art_437397.jpg' },
    { Title: 'Still Life with Apples and a Pot of Primroses', Description: 'French, Aix-en-Provence 1839–1906 Aix-en-Provence', MediaType: 'photo', Country: 'French', Year: 1890, Thumbnail: '/media/art_435882.jpg' },
    { Title: 'A Woman Seated beside a Vase of Flowers (Madame Paul Valpinçon?)', Description: 'French, Paris 1834–1917 Paris', MediaType: 'photo', Country: 'French', Year: 1865, Thumbnail: '/media/art_436121.jpg' },
    { Title: 'Oleanders', Description: 'Dutch, Zundert 1853–1890 Auvers-sur-Oise', MediaType: 'photo', Country: 'Dutch', Year: 1888, Thumbnail: '/media/art_436530.jpg' },
    { Title: 'Madame Georges Charpentier (Marguerite-Louise Lemonnier, 1848–1904) and Her Children, Georgette-Berthe (1872–1945) and Paul-Emile-Charles (1875–1895)', Description: 'French, Limoges 1841–1919 Cagnes-sur-Mer', MediaType: 'photo', Country: 'French', Year: 1878, Thumbnail: '/media/art_438815.jpg' },
    { Title: 'Portrait of a Woman with a Man at a Casement', Description: 'Italian, Florence ca. 1406–1469 Spoleto', MediaType: 'photo', Country: 'Italian', Year: 1440, Thumbnail: '/media/art_436896.jpg' },
  ];

  const insertPhoto = db.prepare(
    'INSERT INTO Photo (Title, Description, MediaType, Country, Year, ThumbnailURL, FullURL) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );
  for (const p of photos) {
    insertPhoto.run(p.Title, p.Description, p.MediaType, p.Country, p.Year, p.Thumbnail, p.Thumbnail);
  }

  // ── Appearances (linking people to photos) ──
  const appearances = [
    { PhotoID: 1, PersonID: 1 },
    { PhotoID: 2, PersonID: 1 },
    { PhotoID: 3, PersonID: 2 },
    { PhotoID: 4, PersonID: 2 },
    { PhotoID: 5, PersonID: 3 },
    { PhotoID: 6, PersonID: 4 },
    { PhotoID: 7, PersonID: 5 },
    { PhotoID: 8, PersonID: 6 },
    { PhotoID: 9, PersonID: 4 },
    { PhotoID: 10, PersonID: 1 },
    { PhotoID: 11, PersonID: 7 },
    { PhotoID: 12, PersonID: 8 },
  ];

  const insertAppearance = db.prepare(
    'INSERT INTO Appearance (PhotoID, PersonID) VALUES (?, ?)'
  );
  for (const a of appearances) {
    insertAppearance.run(a.PhotoID, a.PersonID);
  }
