
import './style.css'
import hero from './assets/hero.jpg'
import lego1 from './assets/lego1.jpg'
import medical1 from './assets/medical1.png'
import teddy1 from './assets/teddy1.png'

document.querySelector('#app').innerHTML = `
<header>Gimtadieniai</header>
<div class="hero"><img src="${hero}"></div>

<div class="section">
<h2>Pasirink savo temą</h2>
<div class="carousel">

<a href="https://www.bricks4kidz.lt/gimtadienio-sventes/" target="_blank">
<div class="card"><img src="${lego1}"><h3>Bricks4Kidz</h3></div>
</a>

<a href="https://littlemedicalschool.com/lithuania/parties/" target="_blank">
<div class="card"><img src="${medical1}"><h3>Little Medical School</h3></div>
</a>

<a href="#">
<div class="card"><img src="${teddy1}"><h3>Teddy gimtadieniai</h3></div>
</a>

</div>
</div>
`
