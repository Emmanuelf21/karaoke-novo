-- Add sample image URLs to existing karaoke rooms for better visual experience
UPDATE karaoke_rooms 
SET image_url = 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
WHERE name = 'Studio A - VIP';

UPDATE karaoke_rooms 
SET image_url = 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
WHERE name = 'Studio B - Party Room';

UPDATE karaoke_rooms 
SET image_url = 'https://img.freepik.com/fotos-premium/sala-de-karaoke-vazia-com-sofa-de-perimetro-e-decoracao-de-madeira-com-mesa-de-espelho-e-microfones-sem-fio_449839-21.jpg'
WHERE name = 'Studio C - Intimate';

UPDATE karaoke_rooms 
SET image_url = 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
WHERE name = 'Studio D - Classic';