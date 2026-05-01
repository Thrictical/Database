1
Initialize the project
Create two folders: client/ and server/. Inside client run npm create vite@latest — choose Vanilla JS. This gives you a fast dev server with hot reload.
2
Install Three.js
Run npm install three inside client/. Import with import * as THREE from 'three'. Also install npm install three/addons for OrbitControls and PointerLockControls.
3
Create the core scene
Set up THREE.Scene, a PerspectiveCamera(75, w/h, 0.1, 1000), and a WebGLRenderer attached to a canvas. Add renderer.setAnimationLoop(animate) to start your game loop.
4
Add lighting
Add an AmbientLight(0xffffff, 0.4) for base lighting and a DirectionalLight(0xffffff, 1) positioned at (10,20,10) for shadows. Enable renderer.shadowMap.enabled = true.
5
Draw a test floor + cube
Add a PlaneGeometry(50,50) for the floor and a BoxGeometry(1,1,1) cube in the center. Confirm they render. Add window.addEventListener('resize', onResize) to handle screen size changes.


1
Design a maze layout as a 2D grid array
Represent the maze as a 2D array: 1 = wall, 0 = path. Start with a hand-crafted 15×15 grid. Later in Week 2 you can generate it procedurally.
2
Convert grid to BoxGeometry walls
Loop through the 2D array. Where value is 1, place a BoxGeometry(2,3,2) at the matching world position. Use MeshLambertMaterial for performance. Merge all wall meshes into a single geometry using BufferGeometryUtils.mergeGeometries() to reduce draw calls.
3
Build the collision system
Store all wall bounding boxes in an array using Box3.setFromObject(wall). Each frame, check if the player's Box3 intersects any wall box. If yes, push the player back to their previous position.
4
Add a floor texture
Use THREE.TextureLoader to load a tile texture. Set texture.wrapS = texture.wrapT = THREE.RepeatWrapping and repeat it 20 times across the floor.

1
Set up PointerLockControls
Import PointerLockControls from three/addons. Attach it to your camera. On click, call controls.lock(). Add a "click to play" overlay that disappears when pointer is locked.
2
WASD keyboard movement
Track key states in a keys = {} object using keydown and keyup events. Each frame, calculate a movement vector from the keys, apply controls.moveRight() and controls.moveForward() multiplied by delta time and speed.
3
Mobile joystick overlay
Create two circular HTML divs as virtual joysticks (left = move, right = look). Use touchstart/touchmove/touchend events. Map joystick delta to the same movement functions as WASD.
4
Apply collision to movement
Save player position before each movement. After moving, run the collision check. If colliding, restore the saved position (separately for X and Z so the player can "slide" along walls).

1
Initialize Express server
Inside server/, run npm init -y then install: express mongoose cors helmet dotenv jsonwebtoken bcryptjs express-rate-limit express-validator
2
Apply security middleware immediately security
Add app.use(helmet()) first — this sets 14 security headers. Add cors({ origin: process.env.CLIENT_URL }) to whitelist only your frontend domain. Never use cors() with no options.
3
Create User + Score Mongoose schemas
User schema: username (unique), email (unique, lowercase), passwordHash, createdAt. Score schema: userId, level, timeMs, gems, sessionToken, verified: Boolean.
4
Connect to MongoDB Atlas
Create a free cluster at mongodb.com/atlas. Store the connection string in .env as MONGODB_URI. Connect using mongoose.connect(process.env.MONGODB_URI). Add .env to .gitignore immediately.

1
Registration endpoint with validation
POST /api/auth/register — validate email format and password strength (min 8 chars, 1 number) using express-validator. Hash the password with bcrypt.hash(password, 12). Never store plain text passwords.
2
Login endpoint returning JWT
POST /api/auth/login — find user by email, compare with bcrypt.compare(). On success, sign two tokens: a short-lived accessToken (15 min) and a refreshToken (7 days). Return access token in response body; send refresh token as httpOnly; Secure; SameSite=Strict cookie.
3
Auth middleware for protected routes
Create a middleware function that reads the Authorization: Bearer token header, verifies with jwt.verify(), and attaches req.user. Attach to any route that needs login.
4
Rate limit auth endpoints security
Apply a strict limiter to login/register: max 10 requests per 15 min per IP. This blocks brute-force attacks. Use express-rate-limit with standardHeaders: true to tell clients how long to wait.
5
Login/register UI in the game
Build a simple HTML overlay (outside the canvas) with username + password fields. On success, store the accessToken in memory (a JS variable — never in localStorage). Show the game canvas only after login.

1
Test all auth flows
Use Postman or Insomnia to test: register new user, login, access a protected route with the token, try to access without token (expect 401), try to brute-force login (expect 429 after 10 tries).
2
Play-test the movement
Walk through your maze for 20 minutes. Note: corners that feel wrong, places the player clips through, camera height that feels off. Fix the feel before adding more features.
3
Performance check
Open browser DevTools → Performance tab. Confirm you're hitting 60fps. If not, check draw calls (should be under 50 with merged geometry). Add renderer.info to the console to see draw calls and triangle count.
4
Set up Git + GitHub
Initialize a Git repo. Create a .gitignore that includes node_modules/, .env, and dist/. Push to GitHub. This is your safety net for the next 2 weeks.



1
Game session token security
When the player starts a level, your server creates a signed gameSessionToken with jwt.sign({ userId, level, startTime }). This token is sent to the client. The client starts the timer only after receiving it.
2
Score submission endpoint
POST /api/scores/submit — require the gameSessionToken in the request. Decode it server-side to get the real startTime. Calculate actualTimeMs = Date.now() - startTime. Ignore any time value sent by the client entirely.
3
Impossibility checks security
Define minimum completion times per level (e.g. Level 1 cannot be finished in under 15 seconds — the maze is physically too large). If actualTimeMs is under the minimum, reject with a 403. Also reject if gems claimed exceeds total gems in that level.
4
Gem collection events
On the client, add 10–15 SphereGeometry gems to the maze. On collision with a gem, remove it and increment a local counter. The counter is sent with the score — but only the count, never the score value itself (server calculates points).


1
Recursive backtracker maze generator
Implement the recursive backtracking algorithm: start from a cell, mark it visited, pick a random unvisited neighbor, carve a path, recurse. This generates perfect mazes with one solution. Seed the RNG with the level number so each level is consistent for all players.
2
Level config object
Define a LEVELS array: each entry has size (15, 19, 23, 27, 31), gemCount, minTimeMs, fogDistance, and wallColor. Load the next level config when the exit is reached.
3
Level transition
When the player touches the exit portal, show a "Level Complete" overlay, POST the score, await the response, then call loadLevel(nextLevel) which clears the scene and rebuilds with the new maze config.
4
Fog of war for atmosphere + performance
Add scene.fog = new THREE.Fog(0x000000, 5, fogDistance). This hides far walls (creating tension) and dramatically reduces overdraw. Increase fog distance each level as the maze gets harder to navigate.

1
Global rate limiter
Apply a global limiter: 100 requests per 15 min per IP on all routes. Apply a stricter one (5 req/min) specifically to score submission. Store limiter state in Redis if you want it to survive server restarts — or use the default in-memory store for now.
2
Input sanitization on every route
Use express-validator on all POST routes. Sanitize strings with .trim().escape(). Validate numbers are within expected ranges. MongoDB is safe from injection if you use Mongoose — never use $where or raw query strings.
3
HTTPS + HSTS
Helmet already adds the HSTS header. When you deploy to Railway, HTTPS is automatic. For local dev, use mkcert to generate a local HTTPS certificate so cookie behavior matches production.
4
Error handling — never leak internals
Add a global error handler as the last Express middleware. In production (NODE_ENV=production), return only a generic message: { error: "Something went wrong" }. Never send stack traces to the client. Log the real error server-side only.
5
Token refresh endpoint
POST /api/auth/refresh — reads the refreshToken cookie, verifies it, and issues a new accessToken. The client should call this whenever a request returns 401. This keeps sessions alive without re-login.

1
Wall and floor textures
Download free textures from polyhaven.com (CC0 license — no legal issues). Apply a MeshStandardMaterial with a map (color) and normalMap to walls. This creates the illusion of depth without extra geometry.
2
Skybox
Use THREE.CubeTextureLoader to load 6 sky images and assign to scene.background. Or use a simpler gradient by setting scene.background = new THREE.Color(0x111122) for a dark dungeon feel.
3
Gem animation + glow
In the animation loop, rotate each gem with gem.rotation.y += delta and bob it up and down with gem.position.y = baseY + Math.sin(time * 2) * 0.2. Add a PointLight child to each gem for a glow effect.
4
HUD overlay
Create an HTML overlay with position: absolute; pointer-events: none over the canvas. Show: gem count, elapsed time, current level, and a minimap (render the 2D maze array as a small canvas in the corner).


1
Win condition + POST score
When the player touches the exit, stop the timer, show a loading state, POST to /api/scores/submit with the session token and gem count. Await the server response. Display the server-calculated score (not a client-calculated one).
2
Leaderboard GET endpoint
GET /api/scores/leaderboard/:level — query MongoDB for top 10 scores on that level, sorted by timeMs ascending. Use .populate('userId', 'username') to include usernames. This endpoint is public (no auth needed).
3
Leaderboard UI panel
After level completion, fetch the leaderboard for that level and render it as a table in the win overlay: rank, username, time, gem count. Highlight the current player's row if they appear.


1
Run through OWASP Top 10 checklist
Check: injection (Mongoose handles it), broken auth (JWT + httpOnly cookies), sensitive data exposure (no passwords in responses, HTTPS only), security misconfiguration (Helmet), XSS (express-validator + DOMPurify on client).
2
Try to cheat your own game
Open browser DevTools, modify localStorage, edit network responses, submit fake scores with Postman. Every attack should be blocked by the backend. If anything gets through, fix it now.
3
JS obfuscation build step
Install javascript-obfuscator. Add a Vite build plugin to obfuscate the output. This won't stop determined hackers, but it raises the effort bar for casual cheaters.


1
Web Audio API via Three.js AudioListener
Add a THREE.AudioListener to the camera. Create THREE.Audio objects for background music and THREE.PositionalAudio for 3D gem pickup sounds (they get louder as you approach).
2
Source free audio
Get CC0 sound effects from freesound.org. Get background music from incompetech.com or pixabay.com/music. You need: footstep loop, gem pickup chime, level complete fanfare, and ambient background music.
3
Mute button + volume control
Add a mute button to the HUD. Browsers block audio autoplay — start audio only on the first user interaction (the pointer lock click). Store the mute preference in sessionStorage so it persists across level reloads.

1
Install and attach Socket.io
Install socket.io on the server and socket.io-client on the client. Wrap your Express app in an HTTP server: const io = new Server(httpServer). Authenticate WebSocket connections using the JWT: validate the token on the connection event.
2
Emit score events
After a score is successfully saved to MongoDB, emit io.emit('new-score', { level, username, timeMs }). On the client, listen for this event and update the leaderboard table in real time without a page refresh.
3
Online player count
Track connected sockets: on connection increment a counter, on disconnect decrement it. Broadcast io.emit('player-count', count) on each change. Display it in the menu as "X players online".

1
Refresh token rotation
Each time the refresh endpoint is called, issue a new refresh token AND invalidate the old one. Store used refresh tokens in a MongoDB collection. If an old token is presented again, it could mean theft — invalidate all sessions for that user immediately.
2
Logout endpoint
POST /api/auth/logout — clear the refreshToken cookie and delete it from the database. On the client, clear the in-memory accessToken variable. Redirect to the login screen.
3
Account lockout after failed logins
After 5 failed logins from the same IP or for the same username, temporarily lock the account for 15 minutes. Store failedAttempts and lockUntil fields on the User schema. Check them before attempting bcrypt.compare().

1
Deploy backend to Railway
Push your server/ folder to GitHub. Connect to railway.app, select "Deploy from GitHub". Add all environment variables from your .env in the Railway dashboard. Railway auto-detects Node.js and assigns an HTTPS URL.
2
Deploy frontend to Vercel
Run npm run build in client/ to get a dist/ folder. Push to GitHub. Connect to vercel.com, import the repo. Set the build command to npm run build and output directory to dist. Add your Railway backend URL as an environment variable.
3
Update CORS for production security
In your backend, update CLIENT_URL in Railway's environment variables to your Vercel domain (e.g. https://mygame.vercel.app). This ensures CORS rejects any other origin.
4
Test everything on production
Go to your Vercel URL. Register a new account, play through all 5 levels, check the leaderboard updates in real time. Open DevTools Network tab — confirm all requests are HTTPS, no mixed content warnings.


1
Loading screen with progress bar
Use THREE.LoadingManager to track texture and audio loading. Show a progress bar while assets load. This prevents the game from starting with missing textures.
2
Particle effects for gem collection
When a gem is collected, spawn 10–15 small Points particles that fly outward and fade over 0.5 seconds. Use a simple particle system with positions updated each frame and opacity decrementing.
3
Settings menu
Add a pause menu (Escape key) with: mouse sensitivity slider, volume slider, graphics quality toggle (low/high shadows), and a logout button. Store settings in localStorage so they persist across sessions.
4
Share score button
On the win screen, add a "Share" button that uses the Web Share API: navigator.share({ title: 'I finished Level 3!', url: window.location.href }). Falls back to copying the URL to clipboard on desktop.


1
Run npm audit on both projects
Run npm audit in both client/ and server/. Fix any high or critical vulnerabilities. Run npm audit fix for automatic fixes, handle the rest manually.
2
Check all .env variables are set in production
Verify Railway has: JWT_SECRET (long random string), JWT_REFRESH_SECRET (different string), MONGODB_URI, CLIENT_URL, NODE_ENV=production. Missing env vars are the most common production bug.
3
Cross-device testing
Test on: desktop Chrome, mobile Safari (iOS), Android Chrome. Check that touch controls work, pointer lock gracefully degrades on mobile, and the game canvas resizes correctly on all screen sizes.
