
import './style.css'

const app = document.querySelector('#app')

function home(){
  app.innerHTML = `
  <header>Gimtadieniai</header>
  <div class="hero">
    <img src="/src/assets/IMG_9281.jpeg">
  </div>
  <div class="section">
    <h2>Pasirink savo temą</h2>
    <div class="carousel">

      <a href="https://www.bricks4kidz.lt/gimtadienio-sventes/" target="_blank">
        <div class="card">
          <img src="/src/assets/IMG_9281.jpeg">
          <h3>Bricks4Kidz</h3>
        </div>
      </a>

      <a href="https://littlemedicalschool.com/lithuania/parties/" target="_blank">
        <div class="card">
          <img src="/src/assets/MMM-web-veterinarija.png">
          <h3>Little Medical School</h3>
        </div>
      </a>

      <div class="card" onclick="navigate('teddy')">
        <img src="/src/assets/995b2e1c-1b62-4fb8-b013-f0fa5d9f36a5.png">
        <h3>Teddy gimtadieniai</h3>
      </div>

      <div class="card" onclick="navigate('extras')">
        <img src="/src/assets/Photo-MP.jpeg">
        <h3>Gimtadienio priedai</h3>
      </div>

    </div>
  </div>
  <div class="section">
    <button onclick="navigate('signup')">Kontaktai / Registracija</button>
  </div>
  `
}

function signup(){
  app.innerHTML = `
  <header>Registracija</header>
  <div class="section">
    <input placeholder="Vardas"><br><br>
    <input placeholder="El. paštas"><br><br>
    <input placeholder="Telefonas"><br><br>
    <button>Registruotis</button>
  </div>
  <div class="section"><button onclick="navigate('home')">Grįžti</button></div>
  `
}

function teddy(){
  app.innerHTML = `
  <header>Teddy gimtadieniai</header>
  <div class="carousel">
    <div class="card"><img src="/src/assets/995b2e1c-1b62-4fb8-b013-f0fa5d9f36a5.png"><h3>Plush Party</h3></div>
    <div class="card"><img src="/src/assets/109f742a-0573-40a1-ad13-8a0916ed56df.png"><h3>Teddy Chef</h3></div>
    <div class="card"><img src="/src/assets/bb44848d-248a-4bfa-bdb1-2b06f7ef7e85.png"><h3>Soft Birthday</h3></div>
  </div>
  <div class="section"><button onclick="navigate('home')">Grįžti</button></div>
  `
}

function extras(){
  app.innerHTML = `
  <header>Gimtadienio priedai</header>
  <div class="section">
    🎉 Animatoriai<br><br>
    🎈 Piñata<br><br>
    🎂 Tortai<br><br>
    🎨 Veidukų piešimas<br><br>
    🎵 DJ ir muzika
  </div>
  <div class="section"><button onclick="navigate('home')">Grįžti</button></div>
  `
}

window.navigate = (page)=>{
  if(page==='signup') signup()
  else if(page==='teddy') teddy()
  else if(page==='extras') extras()
  else home()
}

home()
