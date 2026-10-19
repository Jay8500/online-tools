[out:json][timeout:240];
(area["name"="Telangana"]["admin_level"="4"];area["name"="Andhra Pradesh"]["admin_level"="4"];)->.s;
(nwr["amenity"="police"](area.s);nwr["amenity"="fuel"](area.s););
out center tags;
