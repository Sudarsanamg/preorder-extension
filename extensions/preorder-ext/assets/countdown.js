document.addEventListener("DOMContentLoaded", () => {
  const productId = document.body.dataset.productId; // get from Liquid injection
  
//   fetch(`/apps/your-app/campaign?productId=${productId}`)
//     .then(res => res.json())
//     .then(data => {
//       const endDate = new Date(data.endDate);
      startCountdown(new Date("2025-08-20T23:59:59Z"));
    // })
    // .catch(err => console.error("Failed to fetch campaign data:", err));
});

function startCountdown(endDate) {
  const el = document.getElementById("campaign-countdown");
  function update() {
    const now = new Date();
    const diff = endDate - now;
    if (diff <= 0) {
      el.textContent = "Campaign Ended";
      clearInterval(timer);
      return;
    }
    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const m = Math.floor((diff / (1000 * 60)) % 60);
    const s = Math.floor((diff / 1000) % 60);
    el.textContent = `${d}d ${h}h ${m}m ${s}s`;
  }
  update();
  const timer = setInterval(update, 1000);
}
