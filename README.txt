DISCOVER ANTIQUE
================

A responsive tourism information website for the 18 municipalities of Antique, Philippines.

PROJECT FILES
-------------
- index.html: homepage and municipality carousel
- destination.html: tourist attraction details
- css/: responsive styles
- js/destination-data.js: municipality and attraction information
- js/script.js: homepage interactions and image reuse
- js/destination-detail.js: attraction details and local photo viewer
- js/backdrop.js: smooth photo crossfades
- tourist-spot-images/: the ONLY photo folder
- IMAGE-GUIDE.txt: instructions for adding one image per tourist spot

IMAGE SYSTEM
------------
Only tourist-spot-images is used. Every attraction folder contains one image named image.jpg. The website constructs each path automatically, so no JSON manifest or separate municipality/province/card photo folders are needed.

The municipality carousel card and selected municipality background share the same pool of tourist-spot photos from that municipality. Each attraction detail page uses the image belonging to that specific attraction. The three province feature slides reuse photos from all municipalities. Rotations occur every 3 seconds with smooth crossfades. Photos are never borrowed from a different municipality for municipality-specific sections.

See IMAGE-GUIDE.txt for the exact folder layout and upload steps.

MAPS AND SOURCES
----------------
Existing attraction information, map search links, source links, and website content are preserved. Map searches use the existing attraction names and locations; no unverified coordinates were added.

PUBLISHING
----------
This is a static HTML/CSS/JavaScript website suitable for GitHub Pages. Upload the project files and the tourist-spot-images folder to the published repository root. No GitHub changes have been made by this update.
