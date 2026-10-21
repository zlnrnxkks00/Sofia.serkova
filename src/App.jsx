import { useEffect } from "react";
import Header from "./sections/Header.jsx";
import Hero from "./sections/Hero.jsx";
import Expertise from "./sections/Expertise.jsx";
import History from "./sections/History.jsx";
import Approach from "./sections/Approach.jsx";
import Audiences from "./sections/Audiences.jsx";
import TouchScene from "./sections/TouchScene.jsx";
import Services from "./sections/Services.jsx";
import Reviews from "./sections/Reviews.jsx";
import Principle from "./sections/Principle.jsx";
import Questions from "./sections/Questions.jsx";
import Contact from "./sections/Contact.jsx";
import Footer from "./sections/Footer.jsx";
import { setupPageMotion } from "./motion/pageMotion.js";

export default function App() {
  useEffect(setupPageMotion, []);
  return (
    <>
      <a className="skip-link" href="#main">
        Перейти к содержанию
      </a>
      <Header />
      <main id="main">
        <Hero />
        <Expertise />
        <History />
        <Approach />
        <div className="energy-flow">
          <canvas className="audience-energy" aria-hidden="true" />
          <Audiences />
          <TouchScene />
        </div>
        <Services />
        <Reviews />
        <Principle />
        <Questions />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
