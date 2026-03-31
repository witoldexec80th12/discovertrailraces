import { Metadata } from "next";
import Link from "next/link";
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

      <div className="mx-auto max-w-2xl px-6 sm:px-10 pb-24 pt-4">
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
            DiscoverTrailRaces.com is something I hope to grow by having short
            interviews (quick calls or long async voice convos) with trail
            runners about the recent ultras they ran so it&apos;s a trusted
            resource for ultra runners. Knowing the key details from racers of
            previous race editions can make or break it race day. These
            &ldquo;Runners Voices&rdquo; will take more than a few convos. You
            can{" "}
            <Link
              href="/races/bulgaria_vitosha_100_100k"
              className="underline underline-offset-2 hover:text-neutral-900 transition-colors"
            >
              check one out here
            </Link>
            .
          </p>

          <p>
            If you can share your own Runner Voice,{" "}
            <a
              href="#contact"
              className="underline underline-offset-2 hover:text-neutral-900 transition-colors"
            >
              just click here
            </a>{" "}
            and I&apos;ll reach out within a day.
          </p>

          <p>
            I&apos;d also like to see if this project can grow to help better
            accommodate some of the greater number of runners in the sport, and
            what they want to see more of. I don&apos;t think that people want
            to go to just the cheapest ultras, even though that&apos;s cool too.
            They want to go to races with culture, with views, with a good
            refund policy, with clear terms, good communication, things like
            that.
          </p>

          <p>
            In the future, I&apos;ll add an email newsletter for those that want
            to know when sign-ups open, how to get early bird tickets, and how
            to (hopefully) get some free stuff like gels or other nutrition, or
            even free race tickets, for contributing and being a reader. The
            goal from the start was seeing some friends have race goals that
            went astray because of lack of good information, and have difficulty
            creating a good race calendar. So, it isn&apos;t to make a big
            business from this, but look to have some ways to cover our costs —
            sponsors welcome{" "}
            <span className="italic text-neutral-500">
              (cough: HOKA: cough)
            </span>
            . Feel free to write to me about any suggestions you have, for now
            at{" "}
            <a
              href="mailto:dmichlewicz@gmail.com"
              className="underline underline-offset-2 hover:text-neutral-900 transition-colors"
            >
              dmichlewicz@gmail.com
            </a>
            , although I&apos;ll get an official email address up promptly.
          </p>

          <p className="font-medium text-neutral-900">
            Thanks,
            <br />
            Danny
          </p>

          {/* P.S. */}
          <div className="border-t border-neutral-200 pt-6 space-y-4">
            <p>
              <span className="font-semibold">P.S.</span> Here are some races
              that I find interesting right now — late season races like the{" "}
              <Link
                href="/races/germany_kleiner_kobolt_140k"
                className="underline underline-offset-2 hover:text-neutral-900 transition-colors"
              >
                Kleiner Kobolt 140
              </Link>{" "}
              or{" "}
              <Link
                href="/races/poland_pomerania_ultra_trail_100k"
                className="underline underline-offset-2 hover:text-neutral-900 transition-colors"
              >
                Pomeranian Ultra
              </Link>{" "}
              look interesting. There are also some lesser known, absolutely
              brutal races, like the{" "}
              <Link
                href="/races/italy_utlac_ultra_trail_lago_di_como_250k"
                className="underline underline-offset-2 hover:text-neutral-900 transition-colors"
              >
                Ultra Trail Lago di Como
              </Link>
              , or the more affordable{" "}
              <Link
                href="/races/spain_ultra_trail_sierras_del_bandolero_163k"
                className="underline underline-offset-2 hover:text-neutral-900 transition-colors"
              >
                Sierras Del Bandolero
              </Link>
              , an Andalusian classic that unfortunately got cancelled for 2026.
            </p>

            <p>
              <span className="font-semibold">P.P.S.</span> If there is one
              thing you could do for me to help — if you&apos;ve run a race and
              wouldn&apos;t mind a short conversation, drop your details in the
              form below. I&apos;ll be looking to reward folks with free
              nutrition or contests for free nutrition as soon as possible, and
              if you&apos;re in Europe, will send stuff your way.
            </p>
          </div>
        </div>

        {/* Contact form */}
        <div id="contact" className="mt-12 scroll-mt-8">
          <h2 className="text-xl font-extrabold uppercase tracking-tight text-neutral-900 mb-6">
            Share race recap
          </h2>
          <CrispContactForm />
        </div>
      </div>
    </main>
  );
}
