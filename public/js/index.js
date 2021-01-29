const $ = (q) => document.querySelector(q)
const app = $("#app")
const button = $("button")

/*

<div id="app">
    <main>
      <h1>ultimate-proxy</h1>
      <input placeholder="example.com" />
      <div class="app-options">
        <div>
          <a href="/help">
            <i class="fas fa-question"></i>
          </a>
          <a href="https://github.com/nathan-pham/ultimate-proxy">
            <i class="fab fa-github"></i>
          </a>
        </div>
        <button>submit</button>
      </div>
    </main>
	</div>
  const $ = (q) => document.querySelector(q)

const app = $(".app")
const input = $(".form-password")
const button = $(".form-button")

button.addEventListener("click", () => {
  app.innerHTML = 
  `
  <iframe src="https://${ input.value }" sandbox="allow-scripts allow-forms allow-same-origin"></iframe>
  `
})
   */