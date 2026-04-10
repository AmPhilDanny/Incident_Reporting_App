// Global State
let currentUser = null;

// Initial Mock Data (Seed Database if empty)
const defaultIncidents = [
    {
        title: "Major Collision on Main St",
        category: "Accident",
        desc: "Two cars collided near the intersection. Police are on the scene, expect heavy traffic.",
        user: "SystemAdmin",
        date: new Date(Date.now() - 3600000).toLocaleString(), // 1 hour ago
        photo: null,
        location: {lat: 40.7128, lng: -74.0060}
    },
    {
        title: "Altercation at Central Park",
        category: "Fighting",
        desc: "Group of individuals arguing and fighting near the fountain. Security was called.",
        user: "CitizenJane",
        date: new Date(Date.now() - 86400000).toLocaleString(), // 1 day ago
        photo: null,
        location: {lat: 40.7812, lng: -73.9665}
    },
    {
        title: "Crowd Unrest outside City Hall",
        category: "Rioting",
        desc: "Protesters are throwing objects. It is recommended to avoid the downtown area completely.",
        user: "NewsUpdater",
        date: new Date(Date.now() - 172800000).toLocaleString(), // 2 days ago
        photo: null,
        location: null
    }
];

let incidents = JSON.parse(localStorage.getItem('incidents'));
if (!incidents || incidents.length === 0) {
    incidents = defaultIncidents;
    localStorage.setItem('incidents', JSON.stringify(incidents));
}

// Elements
const screens = document.querySelectorAll('.screen');
const navBtns = document.querySelectorAll('.nav-btn');
const bottomNav = document.getElementById('bottom-nav');

// Init
document.addEventListener('deviceready', onDeviceReady, false);
function onDeviceReady() {
    console.log('Application started natively');
}

// Navigation Logic
function showScreen(targetId) {
    screens.forEach(s => s.classList.remove('active'));
    document.getElementById(targetId).classList.add('active');
    
    if(targetId === 'login-screen') {
        bottomNav.classList.remove('active');
    } else {
        bottomNav.classList.add('active');
    }

    if(targetId === 'main-screen') renderFeed();
    if(targetId === 'profile-screen') {
        renderMyFeed();
        document.getElementById('setting-username').value = currentUser; // load current name into settings
        document.getElementById('profile-msg').textContent = '';
    }
}

navBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        // e.currentTarget gets the button even if icon is clicked
        const targetBtn = e.currentTarget;
        navBtns.forEach(b => b.classList.remove('active'));
        targetBtn.classList.add('active');
        showScreen(targetBtn.dataset.target);
    });
});

// Auth Logic
document.getElementById('btn-login').addEventListener('click', () => {
    const user = document.getElementById('username').value.trim();
    if(user) {
        currentUser = user;
        document.getElementById('user-display').textContent = `User: ${user}`;
        showScreen('main-screen');
    } else {
        alert("Please enter your full name.");
    }
});

document.getElementById('btn-logout').addEventListener('click', () => {
    currentUser = null;
    showScreen('login-screen');
});

// Profile Settings Logic
document.getElementById('btn-save-profile').addEventListener('click', () => {
    const newName = document.getElementById('setting-username').value.trim();
    if(newName && newName !== currentUser) {
        // Find existing posts by this user and update them (optional, but good UX)
        incidents.forEach(inc => {
            if(inc.user === currentUser) {
                inc.user = newName;
            }
        });
        localStorage.setItem('incidents', JSON.stringify(incidents));
        
        currentUser = newName;
        document.getElementById('user-display').textContent = `User: ${newName}`;
        
        const msg = document.getElementById('profile-msg');
        msg.textContent = "Profile updated successfully!";
        renderMyFeed(); // Refresh immediately
    }
});

// Draft State
let draftPhoto = null;
let draftLoc = null;

// Photo Capture
document.getElementById('btn-photo').addEventListener('click', () => {
    document.getElementById('camera-input').click();
});

document.getElementById('camera-input').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if(file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
            draftPhoto = ev.target.result;
            const preview = document.getElementById('photo-preview');
            preview.src = draftPhoto;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
});

// Location Capture
document.getElementById('btn-location').addEventListener('click', () => {
    document.getElementById('loc-display').textContent = "Locating via GPS...";
    if(navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                draftLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                document.getElementById('loc-display').textContent = `✅ Location Attached (Lat: ${draftLoc.lat.toFixed(3)}, Lng: ${draftLoc.lng.toFixed(3)})`;
            },
            (err) => {
                document.getElementById('loc-display').textContent = "❌ Location failed or denied.";
                console.error(err);
            }
        );
    } else {
         document.getElementById('loc-display').textContent = "❌ Geolocation not supported.";
    }
});

// Add Incident
document.getElementById('btn-submit').addEventListener('click', () => {
    const title = document.getElementById('inc-title').value.trim();
    const desc = document.getElementById('inc-desc').value.trim();
    const category = document.getElementById('inc-category').value;

    if(!title || !desc) {
        alert("Please provide both a title and description.");
        return;
    }

    const newIncident = {
        title, desc, category, 
        user: currentUser,
        date: new Date().toLocaleString(),
        photo: draftPhoto,
        location: draftLoc
    };

    incidents.unshift(newIncident);
    localStorage.setItem('incidents', JSON.stringify(incidents));
    alert("Incident successfully reported to the server!");

    // Reset Form
    document.getElementById('inc-title').value = '';
    document.getElementById('inc-desc').value = '';
    document.getElementById('photo-preview').style.display = 'none';
    document.getElementById('loc-display').textContent = 'Location pending...';
    draftPhoto = null;
    draftLoc = null;

    // Go to feed
    document.querySelector('.nav-btn[data-target="main-screen"]').click();
});

// Rendering Feeds
function getCategoryClass(category) {
    if(category === 'Accident') return 'accident';
    if(category === 'Fighting') return 'fighting';
    if(category === 'Rioting') return 'rioting';
    return '';
}

function renderIncident(inc) {
    const locText = inc.location ? `📍 GPS: ${inc.location.lat.toFixed(4)}, ${inc.location.lng.toFixed(4)}` : '📍 Location not provided';
    const imgHtml = inc.photo ? `<img src="${inc.photo}">` : '';
    const classTag = getCategoryClass(inc.category);

    return `
        <div class="incident-card">
            <h4>${inc.title}</h4>
            <div class="category-tag ${classTag}">${inc.category}</div>
            <p class="incident-desc">${inc.desc}</p>
            ${imgHtml}
            <div class="meta-box">
                <span>👤 Reported by: <strong>${inc.user}</strong></span>
                <span>🕒 ${inc.date}</span>
                <span>${locText}</span>
            </div>
        </div>
    `;
}

document.getElementById('filter-category').addEventListener('change', renderFeed);

function renderFeed() {
    const filter = document.getElementById('filter-category').value;
    const list = filter === 'All' ? incidents : incidents.filter(i => i.category === filter);
    
    const feedDom = document.getElementById('feed');
    if(list.length === 0) {
        feedDom.innerHTML = "<p style='text-align:center; color:#64748b; margin-top:20px;'>No incidents match this category.</p>";
        return;
    }
    feedDom.innerHTML = list.map(renderIncident).join('');
}

function renderMyFeed() {
    const mylist = incidents.filter(i => i.user === currentUser);
    const feedDom = document.getElementById('my-feed');
    if(mylist.length === 0) {
        feedDom.innerHTML = "<p style='text-align:center; color:#64748b; margin-top:20px;'>You have not reported anything yet.</p>";
        return;
    }
    feedDom.innerHTML = mylist.map(renderIncident).join('');
}

// Boot up
showScreen('login-screen');
