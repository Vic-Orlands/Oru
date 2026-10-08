"use client";

import { useState } from "react";
import { useUser } from "@/lib/auth/session";
import { IconGhost2Filled } from "@tabler/icons-react";
import { AnimatePresence, motion } from "motion/react";

import { DEFAULT_GREETING, GREETINGS } from "@/lib/greetings";
import { useShowSuggestionsPref } from "@/lib/home-prefs";
import { useHomeSuggestions } from "@/lib/home-suggestions";
import { pickIncognitoTagline, useIncognitoState } from "@/lib/incognito";
import { EASE_OUT, pinRasterPath, rise, SHED_BLUR } from "@/lib/motion";
import { useCachedName } from "@/lib/name-cache";
import { InlineScript } from "./inline-script";
import { SuggestionCards } from "./suggestion-cards";
import { WhirlLogo } from "./whirl-logo";

declare global {
  interface Window {
    /** The boot script's greeting pick, adopted by React on hydration. */
    __whirlGreeting?: string;
  }
}

/* One masked ring of the logo's rest pose. Static string — no user data. */
function bootRing(url: string) {
  const mask =
    `-webkit-mask-image:url(${url});mask-image:url(${url});` +
    "-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat;" +
    "-webkit-mask-position:center;mask-position:center;" +
    "-webkit-mask-size:contain;mask-size:contain";
  return (
    `<span style="position:absolute;inset:0;${mask}">` +
    '<span class="bg-foreground-soft" style="position:absolute;inset:0"></span>' +
    "</span>"
  );
}

const BOOT_LOGO =
  '<span style="position:relative;display:inline-block;width:32px;height:32px;flex-shrink:0">' +
  bootRing("/whirl-ring-outer.svg") +
  bootRing("/whirl-ring-inner.svg") +
  "</span>";

/* The greeting steps down below md because the longest lines in lib/greetings.ts
   ("Long time no see, {name}") plus a real first name do not fit across a
   phone at 28px; they truncated, which turns a warm welcome into "Long time
   no se…". The 40px slot above holds either size without moving. */
const GREETING_CLASS =
  "min-w-0 truncate text-[22px]/8 font-medium tracking-tight md:text-[28px]/9";

/* InlineScript executes this only from server HTML. On client navigation it
   renders as text/plain, avoiding React's executable-script warning. */
const GREETING_BOOT = `(function(){try{
var s=document.currentScript,el=s&&s.parentElement;if(!el)return;
var name=null;try{name=localStorage.getItem("greeting-name")}catch(e){}
if(!name)return;
var lines=${JSON.stringify(GREETINGS)};
var line=lines[Math.floor(Math.random()*lines.length)];
window.__whirlGreeting=line;
var row=document.createElement("div");
row.className="flex h-full min-w-0 items-center justify-center gap-3";
var logo=document.createElement("span");
logo.className="flex size-8 shrink-0 items-center justify-center";
logo.innerHTML='${BOOT_LOGO}';
var h=document.createElement("h1");
h.className=${JSON.stringify(GREETING_CLASS)};
h.textContent=line.split("{name}").join(name);
row.appendChild(logo);row.appendChild(h);el.appendChild(row);
}catch(e){}})();`;

/* The home face's dressing around the composer: logo + a witty greeting
   above, a couple of random conversation starters below. Split out of the
   old HomeView so the chat face (chat-view.tsx) can fade these away while
   the composer itself glides to the bottom of a thread. */

/* Fixed-height slot so the header appearing never shifts the composer
   below it. The greeting name is cached (lib/name-cache.ts) and read
   pre-paint, so on every repeat visit the header is simply THERE on the
   first frame — no skeleton, no entrance. Only the one genuinely-unknown
   first visit holds an empty slot and rises the header in when Clerk
   answers. */
export function HomeGreeting() {
  const { user, isLoaded } = useUser();
  /* Randomized in the initializer (not an effect) so the first paint that
     shows it is already the real line; the server branch keeps SSR
     deterministic (nothing renders it before hydration anyway). */
  /* The server always paints the first line. The boot pick is adopted during
     hydration so the pre-paint DOM and React settle on the same greeting. */
  const [greeting] = useState(() => {
    if (typeof window === "undefined") return DEFAULT_GREETING;
    const bootGreeting = window.__whirlGreeting ?? DEFAULT_GREETING;
    delete window.__whirlGreeting;
    return bootGreeting;
  });

  const liveName = isLoaded
    ? user?.firstName ||
      user?.fullName ||
      user?.username ||
      user?.primaryEmailAddress?.emailAddress ||
      "Anon"
    : null;
  const { name, warm } = useCachedName(liveName);

  /* Incognito: you're nobody in particular here, so the personalized line
     steps aside for a visit-stable tagline. The swap rides the same
     blur-crossfade a name change does. */
  const { enabled: incognito } = useIncognitoState();
  const [tagline] = useState(pickIncognitoTagline);

  const heading = incognito
    ? tagline
    : name === null
      ? null
      : greeting.replaceAll("{name}", name);

  /* Cache-warm headers skip the entrance and are just there; only a cold
     slot rises in. The latch lives in useCachedName, alongside the read
     that knows the answer. */
  const entrance = warm ? { ...rise(0), initial: false as const } : rise(0);

  return (
    <div className="mb-7 h-10">
      {heading === null && (
        <div className="h-full" suppressHydrationWarning>
          <InlineScript html={GREETING_BOOT} />
        </div>
      )}
      {heading !== null && (
        <motion.div
          {...entrance}
          className="flex h-full min-w-0 items-center justify-center gap-3"
        >
          {/* An exact 32px flex box: left inline, the logo's inline-block
              span picks up baseline space and rides a few px high. The
              mark and the ghost crossfade in this fixed box (no mode:
              "wait" — waiting out the exit reads as a stall). */}
          <span className="relative size-8 shrink-0">
            <AnimatePresence initial={false}>
              <motion.span
                key={incognito ? "ghost" : "mark"}
                initial={{ opacity: 0, scale: 0.6, rotate: -12 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.6, rotate: 12 }}
                transition={{ type: "spring", stiffness: 520, damping: 28 }}
                transformTemplate={pinRasterPath}
                className="absolute inset-0 flex items-center justify-center"
              >
                {incognito ? (
                  /* A slow idle bob — the ghost hovers, as ghosts do. */
                  <motion.span
                    animate={{ y: [0, -3, 0] }}
                    transition={{
                      duration: 2.4,
                      ease: "easeInOut",
                      repeat: Infinity,
                    }}
                    className="flex text-foreground-soft"
                  >
                    <IconGhost2Filled size={30} />
                  </motion.span>
                ) : (
                  <WhirlLogo size={32} />
                )}
              </motion.span>
            </AnimatePresence>
          </span>
          <h1 className={GREETING_CLASS}>
            {/* Keyed on the text: the cached name being replaced by a
                fresh sign-in (or sign-out) blur-swaps instead of
                snapping. initial={false} — the slot's own rise owns the
                entrance. */}
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={heading}
                initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                animate={{
                  opacity: 1,
                  y: 0,
                  filter: "blur(0px)",
                  transitionEnd: SHED_BLUR,
                }}
                exit={{
                  opacity: 0,
                  y: -8,
                  filter: "blur(4px)",
                  transition: { duration: 0.14, ease: [0.4, 0, 1, 1] },
                }}
                transition={{
                  opacity: { duration: 0.28, ease: EASE_OUT },
                  filter: { duration: 0.28, ease: EASE_OUT },
                  y: { type: "spring", stiffness: 380, damping: 30 },
                }}
                transformTemplate={pinRasterPath}
                className="inline-block"
              >
                {heading}
              </motion.span>
            </AnimatePresence>
          </h1>
        </motion.div>
      )}
    </div>
  );
}

/* The two slots come up filled from the paint cache, or as empty capsules on
   a genuinely first visit. Gemini personalizes them behind that; whatever
   lands crosses over the text already on screen. All the state — cache,
   reserve, dismissals — lives in lib/home-suggestions.ts. */
export function HomeSuggestions({
  onPick,
}: {
  onPick: (prompt: string) => void;
}) {
  const [showSuggestions] = useShowSuggestionsPref();
  const { suggestions, dismiss } = useHomeSuggestions(showSuggestions);

  if (!showSuggestions) return null;
  return (
    <div className="mt-3">
      <SuggestionCards
        suggestions={suggestions}
        onPick={onPick}
        onDismiss={(id) => void dismiss(id)}
      />
    </div>
  );
}
