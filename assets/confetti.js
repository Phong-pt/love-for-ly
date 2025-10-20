(function(){
  function confettiBurst() {
    const count = 120;
    const defaults = { spread: 60, ticks: 120, gravity: 0.9, decay: 0.94, startVelocity: 22, shapes:['heart'] };
    const end = Date.now() + 600;
    const frame = () => {
      // Fallback simple hearts if canvas-confetti not available
      for (let i = 0; i < 10; i++) {
        const d = document.createElement('div');
        d.textContent = '❤';
        d.style.position = 'fixed';
        d.style.left = Math.random() * 100 + 'vw';
        d.style.top = '-5vh';
        d.style.fontSize = (14 + Math.random()*18) + 'px';
        d.style.color = '#ff3366';
        d.style.transform = 'translateY(0)';
        d.style.transition = 'transform 2.2s linear, opacity 2.2s linear';
        d.style.opacity = '1';
        d.style.pointerEvents = 'none';
        document.body.appendChild(d);
        requestAnimationFrame(() => {
          d.style.transform = 'translateY(110vh)';
          d.style.opacity = '0';
        });
        setTimeout(() => d.remove(), 2300);
      }
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }
  window.confettiBurst = confettiBurst;
})();


