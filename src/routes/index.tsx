import { createFileRoute } from "@tanstack/react-router";
import { ArrowDown, ArrowUpRight, Brush, ChartNoAxesCombined, Cross, Mail, Menu, MousePointer2, Palette, PenTool, Phone, Sparkles, X } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/")({ component: Portfolio });

const works = [
  { title: "Dean Winchester", type: "Ilustração digital • Personagem", note: "Estudo de personagem, composição e identidade visual.", image: "/images/dean-winchester.jpg" },
  { title: "Michael Kaiser", type: "Ilustração digital • Anime", note: "Expressão, movimento e contraste em uma arte autoral.", image: "/images/michael-kaiser.jpg" },
  { title: "Personagem mascarado", type: "Ilustração digital • Original", note: "Personagem autoral com estética intensa e contraste de cores.", image: "/images/personagem-mascarado.jpg" },
  { title: "Retrato em tons dourados", type: "Desenho digital • Retrato", note: "Estudo de expressão, luz e acabamento digital.", image: "/images/retrato-dourado.jpg" },
  { title: "Retrato ruivo", type: "Ilustração digital • Personagem", note: "Construção de personagem e paleta quente.", image: "/images/retrato-ruivo.jpg" },
  { title: "Estudo de personagem", type: "Ilustração digital • Anime", note: "Expressividade e linguagem visual em uma composição autoral.", image: "/images/personagem-vermelho.jpg" },
  { title: "Personagem fantástico", type: "Ilustração digital • Fantasia", note: "Cores vibrantes, acessórios e narrativa visual.", image: "/images/personagem-azul.jpg" },
  { title: "Universo criativo", type: "Arte digital • Composição", note: "Painel com referências, personagens e identidade visual.", image: "/images/painel-criativo.jpg" },
];

function Portfolio() {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);
  return (
    <main className="portfolio">
      <div className="ambient ambient-one" /><div className="ambient ambient-two" />
      <header className="topbar">
        <a className="brand" href="#inicio" onClick={closeMenu}><span className="brand-mark">DF</span><span>DAVI FRANÇA<small>CREATIVE PORTFOLIO</small></span></a>
        <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Abrir menu">{menuOpen ? <X /> : <Menu />}</button>
        <nav className={menuOpen ? "nav nav-open" : "nav"}>
          <a href="#sobre" onClick={closeMenu}>Sobre</a><a href="#atuacao" onClick={closeMenu}>O que faço</a><a href="#trabalhos" onClick={closeMenu}>Portfólio</a><a href="#contato" className="nav-contact" onClick={closeMenu}>Vamos conversar <ArrowUpRight size={15}/></a>
        </nav>
      </header>

      <section className="hero" id="inicio">
        <div className="hero-copy">
          <div className="eyebrow"><span className="status-dot"/> DISPONÍVEL PARA NOVOS PROJETOS</div>
          <p className="hero-kicker">ESTRATÉGIA • DESIGN • ARTE DIGITAL</p>
          <h1>Ideias que<br/><span>ganham forma.</span></h1>
          <p className="hero-intro">Sou <strong>Davi França Oliveira</strong> — gestor de tráfego pago, designer e ilustrador digital. Uno criatividade e estratégia para transformar ideias em experiências visuais e resultados.</p>
          <div className="hero-actions"><a className="button button-primary" href="#trabalhos">Explorar trabalhos <ArrowUpRight size={17}/></a><a className="text-link" href="#sobre">Conheça minha história <ArrowDown size={15}/></a></div>
          <div className="hero-meta"><span>20 ANOS</span><i/> <span>DESIGN • CEUMA</span><i/> <span>BRASIL</span></div>
        </div>
        <div className="hero-art">
          <div className="orbit orbit-a"/><div className="orbit orbit-b"/>
          <div className="hero-frame"><div className="frame-top"><span>ARTIST / DESIGNER</span><span>001—DF</span></div><div className="portrait-placeholder"><img src="/images/davi-franca.jpg" alt="Retrato de Davi França Oliveira" fetchPriority="high"/><span className="portrait-label">YOUR VISION<br/>MY CREATION</span></div><div className="frame-bottom"><span>CRIATIVIDADE EM MOVIMENTO</span><Sparkles size={17}/></div></div>
          <div className="floating-tag tag-blue"><ChartNoAxesCombined size={17}/> PERFORMANCE</div><div className="floating-tag tag-purple"><PenTool size={17}/> DIGITAL ART</div>
          <div className="hero-stamp">DAVI<br/><b>FRANÇA</b><small>CREATIVE MINDSET</small></div>
        </div>
        <a className="scroll-cue" href="#sobre"><span>SCROLL TO DISCOVER</span><div><ArrowDown size={15}/></div></a>
      </section>

      <section className="intro-strip"><span>CRIATIVIDADE COM PROPÓSITO</span><div/><span>ESTRATÉGIA COM INTENÇÃO</span><div/><span>FÉ COMO FUNDAMENTO</span></section>

      <section className="about section-wrap" id="sobre">
        <div className="section-index">01 / QUEM SOU</div>
        <div className="about-grid"><div><p className="eyebrow">MUITO PRAZER, DAVI.</p><h2>Entre números,<br/><em>formas e fé.</em></h2></div><div className="about-text"><p>Sou um jovem cristão, estudante de Design no CEUMA e apaixonado por criar. Minha jornada conecta o universo analítico do marketing digital com a liberdade criativa do design e da ilustração.</p><p>Acredito que um bom trabalho precisa de intenção: entender pessoas, comunicar com clareza e construir algo que tenha identidade. Gosto de aprender, experimentar e transformar referências em projetos com personalidade.</p><div className="faith-note"><Cross size={18}/><span>Minha fé em Cristo é parte de quem sou e do propósito que busco levar para tudo o que faço.</span></div></div></div>
      </section>

      <section className="services section-wrap" id="atuacao">
        <div className="section-index">02 / MINHA ATUAÇÃO</div><div className="section-heading"><div><p className="eyebrow">CRIATIVIDADE + PERFORMANCE</p><h2>O que posso <em>construir.</em></h2></div><p>Do planejamento à execução, trabalho para que cada ideia tenha uma presença forte e uma comunicação consistente.</p></div>
        <div className="service-grid">
          <article className="service-card"><div className="service-icon"><ChartNoAxesCombined/></div><span className="service-number">01</span><h3>Gestão de tráfego pago</h3><p>Estratégia de campanhas, análise de métricas e otimização para conectar marcas às pessoas certas.</p><div className="service-tags"><span>Meta Ads</span><span>Performance</span><span>Estratégia</span></div></article>
          <article className="service-card"><div className="service-icon"><Palette/></div><span className="service-number">02</span><h3>Design gráfico</h3><p>Comunicação visual com conceito, hierarquia e personalidade para fortalecer marcas e ideias.</p><div className="service-tags"><span>Identidade</span><span>Composição</span><span>Visual</span></div></article>
          <article className="service-card"><div className="service-icon"><Brush/></div><span className="service-number">03</span><h3>Ilustração digital</h3><p>Criação de personagens, retratos e artes digitais com traço autoral e atenção aos detalhes.</p><div className="service-tags"><span>Personagens</span><span>Retratos</span><span>Arte digital</span></div></article>
        </div>
      </section>

      <section className="works section-wrap" id="trabalhos">
        <div className="section-index">03 / GALERIA CRIATIVA</div><div className="section-heading"><div><p className="eyebrow">ESTUDOS, IDEIAS E CRIAÇÕES</p><h2>Feito com <em>identidade.</em></h2></div><p>Uma seleção de ilustrações e experimentações visuais. Cada peça representa uma etapa do meu processo criativo.</p></div>
        <div className="work-grid">{works.map((work, index) => <article className="work-card" key={work.title}><div className="work-visual"><img src={work.image} alt={work.title} loading="lazy"/><span className="work-art-label">ARTWORK / {String(index+1).padStart(2,"0")}</span><a className="work-open" href={work.image} target="_blank" rel="noreferrer" aria-label={"Abrir "+work.title}><ArrowUpRight/></a></div><div className="work-info"><div><span>{work.type}</span><h3>{work.title}</h3><p>{work.note}</p></div><span className="work-index">{String(index+1).padStart(2,"0")}</span></div></article>)}</div>
        <p className="gallery-note"><Sparkles size={15}/> Ilustrações autorais de Davi França Oliveira.</p>
      </section>

      <section className="quote-band"><span className="quote-mark">“</span><p>Design é mais do que deixar bonito.<br/><em>É dar forma ao que precisa ser comunicado.</em></p><span className="quote-credit">DAVI FRANÇA — VISÃO CRIATIVA</span></section>

      <section className="contact section-wrap" id="contato"><div className="section-index">04 / CONTATO</div><div className="contact-layout"><div><p className="eyebrow">TEM UMA IDEIA?</p><h2>Vamos criar algo<br/><em>memorável.</em></h2><p className="contact-intro">Se você procura criatividade, estratégia ou uma nova perspectiva para seu projeto, será um prazer conversar.</p></div><div className="contact-card"><span className="contact-card-label">FALE COMIGO</span><a href="https://wa.me/5598984375774" target="_blank" rel="noreferrer"><Phone/> <span><small>WHATSAPP</small>+55 98 98437-5774</span><ArrowUpRight className="contact-arrow"/></a><a href="mailto:do39331@gmail.com"><Mail/> <span><small>E-MAIL</small>do39331@gmail.com</span><ArrowUpRight className="contact-arrow"/></a><div className="contact-social"><span>São Luís, Maranhão • Brasil</span><span>Fé, criatividade e propósito.</span></div></div></div></section>

      <footer className="footer"><a className="brand" href="#inicio"><span className="brand-mark">DF</span><span>DAVI FRANÇA<small>CREATIVE PORTFOLIO</small></span></a><span>© {new Date().getFullYear()} DAVI FRANÇA OLIVEIRA</span><a href="#inicio">VOLTAR AO TOPO ↑</a></footer>
    </main>
  );
}
