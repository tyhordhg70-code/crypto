import { useEffect, useRef } from "react";

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  type: "node" | "btc" | "eth" | "block";
  alpha: number;
  phase: number;
  phaseSpeed: number;
}

export function AnimatedCryptoBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const count = Math.min(48, Math.floor((width * height) / 18000));
    const nodes: Node[] = Array.from({ length: count }, (_, i) => {
      const typeRand = Math.random();
      const type: Node["type"] =
        i < 2 ? "btc" : i < 4 ? "eth" : typeRand < 0.15 ? "block" : "node";
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        radius: type === "btc" || type === "eth" ? 14 + Math.random() * 6 : 4 + Math.random() * 5,
        type,
        alpha: 0.08 + Math.random() * 0.14,
        phase: Math.random() * Math.PI * 2,
        phaseSpeed: 0.005 + Math.random() * 0.01,
      };
    });

    let animId: number;
    let frame = 0;

    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      frame++;

      for (const n of nodes) {
        n.phase += n.phaseSpeed;
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < -20) n.x = width + 20;
        if (n.x > width + 20) n.x = -20;
        if (n.y < -20) n.y = height + 20;
        if (n.y > height + 20) n.y = -20;
      }

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].x - nodes[i].x;
          const dy = nodes[j].y - nodes[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 180) {
            const t = 1 - dist / 180;
            const a = t * 0.12;
            ctx.beginPath();
            const grad = ctx.createLinearGradient(nodes[i].x, nodes[i].y, nodes[j].x, nodes[j].y);
            grad.addColorStop(0, `rgba(99,102,241,${a})`);
            grad.addColorStop(1, `rgba(139,92,246,${a})`);
            ctx.strokeStyle = grad;
            ctx.lineWidth = t * 1.5;
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();

            if (t > 0.65 && frame % 120 === 0) {
              ctx.beginPath();
              ctx.arc(
                (nodes[i].x + nodes[j].x) / 2,
                (nodes[i].y + nodes[j].y) / 2,
                2,
                0,
                Math.PI * 2
              );
              ctx.fillStyle = `rgba(139,92,246,${a * 2})`;
              ctx.fill();
            }
          }
        }
      }

      for (const n of nodes) {
        const pulse = Math.sin(n.phase) * 0.04;
        const a = n.alpha + pulse;

        if (n.type === "btc") {
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.radius + 6, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(247,147,26,${a * 0.18})`;
          ctx.fill();
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(247,147,26,${a * 0.7})`;
          ctx.fill();
          ctx.fillStyle = `rgba(255,255,255,${a * 2})`;
          ctx.font = `bold ${n.radius * 1.1}px sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("₿", n.x, n.y + 1);
        } else if (n.type === "eth") {
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.radius + 6, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(98,126,234,${a * 0.18})`;
          ctx.fill();
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(98,126,234,${a * 0.7})`;
          ctx.fill();
          ctx.fillStyle = `rgba(255,255,255,${a * 2})`;
          ctx.font = `bold ${n.radius * 1.0}px sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("Ξ", n.x, n.y + 1);
        } else if (n.type === "block") {
          const s = n.radius * 2;
          ctx.beginPath();
          ctx.roundRect(n.x - s / 2, n.y - s / 2, s, s, 3);
          ctx.fillStyle = `rgba(99,102,241,${a * 0.6})`;
          ctx.fill();
          ctx.strokeStyle = `rgba(139,92,246,${a * 0.8})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(99,102,241,${a * 0.5})`;
          ctx.fill();
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.radius * 1.8, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(139,92,246,${a * 0.1})`;
          ctx.fill();
        }
      }
    }

    function animate() {
      draw();
      animId = requestAnimationFrame(animate);
    }
    animate();

    const handleResize = () => {
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 1 }}
    />
  );
}
