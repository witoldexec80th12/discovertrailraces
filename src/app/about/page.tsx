import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import Script from "next/script";
import CrispContactForm from "./CrispContactForm";

export const metadata: Metadata = {
  title: "About | DiscoverTrailRaces",
  description:
    "Why DiscoverTrailRaces exists — a site by trail runners, for trail runners, comparing European ultras by real cost and runner insight.",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
      <Script
        id="crisp-chat-about"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.$crisp = window.$crisp || [];
            window.CRISP_WEBSITE_ID = "7cf61847-4944-4b7a-9143-e9816411733e";
            if (!window.__crispLoaded) {
              window.__crispLoaded = true;
              (function() {
                var d = document;
                var s = d.createElement("script");
                s.src = "https://client.crisp.chat/l.js";
                s.async = 1;
                d.getElementsByTagName("head")[0].appendChild(s);
              })();
            }
          `,
        }}
      />

      {/* Top nav */}
      <div className="px-6 sm:px-10 lg:px-16 py-6 flex items-center gap-6 text-sm font-semibold text-neutral-500">
        <Link href="/" className="hover:text-neutral-900 transition-colors">
          ← Home
        </Link>
        <Link href="/cost" className="hover:text-neutral-900 transition-colors">
          Cost Index
        </Link>
      </div>

      {/* ~30% wider than max-w-2xl on desktop */}
      <div className="mx-auto max-w-2xl sm:max-w-[54rem] px-6 sm:px-10 pb-24 pt-4">
        {/* Heading */}
        <h1 className="text-4xl sm:text-5xl font-extrabold uppercase tracking-tight text-neutral-900 mb-10">
          About
        </h1>

        {/* Body */}
        <div className="space-y-6 text-neutral-700 text-base sm:text-lg leading-relaxed">
          <p>
            This website is by trail runners, and for trail runners. I built it
            with the help of some friends, because I love exploring new races
            and saw that it was a pain in the butt for people to find good,
            vetted races that also fit with their big race goals. Crappy
            websites, poor checkout processes, and also rising race prices kind
            of got me upset. I also have found some of those more
            &ldquo;unknown&rdquo; trail races that have just been an absolute
            delight. Cool local vibes, free giveaways, amazing after-parties
            steeped in giving back to the community, and reasonable price. Some
            of those races felt like stumbling into a neighbor&apos;s BBQ after
            a big day out on a new route.
          </p>

          <p>
            DiscoverTrailRaces.com is something I hope to grow consistently
            over the years. There&rsquo;s lots planned. Right now, I&rsquo;m
            interested in having short interviews (quick calls or longer
            WhatsApp convos) with trail runners about recent ultras they ran,
            so it&rsquo;s a more trusted resource for ultra runners. Knowing
            the key details from racers of previous race editions can make or
            break it race day. You can{" "}
            <Link
              href="/races/bulgaria_vitosha_100_100k"
              className="underline underline-offset-2 hover:text-neutral-900 transition-colors"
            >
              check one out here
            </Link>
            .
          </p>

          <p>
            If you can share your own Runner Voice or have a race recap to
            contribute, just fill out the form below, and I&rsquo;ll reach out
            within a day.
          </p>
        </div>

        {/* Contact form — above the sign-off */}
        <div id="contact" className="mt-8 mb-10 scroll-mt-8">
          <h2 className="text-xl font-extrabold uppercase tracking-tight text-neutral-900 mb-6">
            Share race recap
          </h2>
          <CrispContactForm />
        </div>

        {/* Sign-off */}
        <p className="text-neutral-700 text-base sm:text-lg leading-relaxed">
          Thanks,
          <br />
          Danny
        </p>

        {/* P.S. with inline photo */}
        <div className="border-t border-neutral-200 mt-8 pt-6 text-neutral-700 text-base sm:text-lg leading-relaxed overflow-hidden">
          <Image
            src="/images/about_photo.jpg"
            alt="Danny on a trail"
            width={200}
            height={270}
            className="float-right ml-6 mb-3 rounded-xl object-cover shadow-sm"
          />
          <p>
            <span className="font-semibold">P.S.</span> A bit about me — I
            spend about half the year in Spain so love running in
            Spain&rsquo;s mountains, particularly the islands. I&rsquo;m
            reasonably new to ultra running — I&rsquo;ve run the{" "}
            <Link
              href="/races/transgrancanaria_classic"
              className="underline underline-offset-2 hover:text-neutral-900 transition-colors"
            >
              TransGranCanaria Classic
            </Link>{" "}
            twice, as well as the first year of the{" "}
            <Link
              href="/races/mallorca_utmb_pedra_seca_100k"
              className="underline underline-offset-2 hover:text-neutral-900 transition-colors"
            >
              Mallorca UTMB Pedra Seca 100km
            </Link>
            , and the{" "}
            <Link
              href="/races/tryavna_ultra_80k"
              className="underline underline-offset-2 hover:text-neutral-900 transition-colors"
            >
              Tryavna Ultra 80km
            </Link>{" "}
            in Bulgaria. My girlfriend is signed up for the{" "}
            <Link
              href="/races/sormlands_100k"
              className="underline underline-offset-2 hover:text-neutral-900 transition-colors"
            >
              Sormlands 100km
            </Link>
            , which I&rsquo;m looking forward to exploring as well.
          </p>
        </div>
      </div>
    </main>
  );
}
