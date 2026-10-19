[out:json][timeout:240];
(area["name"="Telangana"]["admin_level"="4"];area["name"="Andhra Pradesh"]["admin_level"="4"];)->.s;
node["place"~"^(city|town|suburb|quarter|neighbourhood|village)$"](area.s);
out body qt;
