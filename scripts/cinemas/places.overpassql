[out:json][timeout:180];
(area["name"="Telangana"]["admin_level"="4"];area["name"="Andhra Pradesh"]["admin_level"="4"];)->.s;
nwr["amenity"="cinema"](area.s)->.c;
(node(around.c:3000)["place"~"^(suburb|quarter|neighbourhood)$"];node(around.c:20000)["place"~"^(city|town)$"];);
out body qt;
