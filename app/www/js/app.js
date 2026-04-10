// Global State
let currentUser = null;
let incidents = JSON.parse(localStorage.getItem('incidents') || '[]');

// Elements
const screens = document.querySelectorAll('.screen');
const navBtns = document.querySelectorAll('.nav-btn');
const bottomNav = document.getElementById('bottom-nav');

// Init
document.addEventListener('deviceready', onDeviceReady, false);
function onDeviceReady() {
    console.log('Application started');
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
    if(targetId === 'profile-screen') renderMyFeed();
}

navBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        navBtns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        showScreen(e.target.dataset.target);
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
        alert("Enter your name");
    }
});

document.getElementById('btn-logout').addEventListener('click', () => {
    currentUser = null;
    showScreen('login-screen');
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
    document.getElementById('loc-display').textContent = "Locating...";
    if(navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                draftLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                document.getElementById('loc-display').textContent = `Lat: ${draftLoc.lat.toFixed(4)}, Lng: ${draftLoc.lng.toFixed(4)}`;
            },
            (err) => {
                document.getElementById('loc-display').textContent = "Location failed";
                console.error(err);
            }
        );
    }
});

// Add Incident
document.getElementById('btn-submit').addEventListener('click', () => {
    const title = document.getElementById('inc-title').value;
    const desc = document.getElementById('inc-desc').value;
    const category = document.getElementById('inc-category').value;

    if(!title || !desc) {
        alert("Please fill title and details");
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
    alert("Incident Reported Successfully!");

    // Reset Form
    document.getElementById('inc-title').value = '';
    document.getElementById('inc-desc').value = '';
    document.getElementById('photo-preview').style.display = 'none';
    document.getElementById('loc-display').textContent = 'No location active';
    draftPhoto = null;
    draftLoc = null;

    // Go to feed
    navBtns[0].click();
});

// Rendering Feeds
function renderIncident(inc) {
    const locText = inc.location ? `📍 ${inc.location.lat.toFixed(4)}, ${inc.location.lng.toFixed(4)}` : '';
    const imgHtml = inc.photo ? `<img src="${inc.photo}">` : '';

    return `
        <div class="incident-card">
            <h4>${inc.title}</h4>
            <div class="category">${inc.category}</div>
            <p>${inc.desc}</p>
            ${imgHtml}
            <div class="meta">
                Reported by ${inc.user} - ${inc.date} <br> ${locText}
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
        feedDom.innerHTML = "<p style='text-align:center;'>No incidents found.</p>";
        return;
    }
    feedDom.innerHTML = list.map(renderIncident).join('');
}

function renderMyFeed() {
    const mylist = incidents.filter(i => i.user === currentUser);
    const feedDom = document.getElementById('my-feed');
    if(mylist.length === 0) {
        feedDom.innerHTML = "<p style='text-align:center;'>You have not reported anything.</p>";
        return;
    }
    feedDom.innerHTML = mylist.map(renderIncident).join('');
}

// Initial View
showScreen('login-screen');
