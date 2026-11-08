"use client";

import Link from "next/link";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { SOCIAL_PATHS, type SocialKey } from "@/components/avyra/avyra-footer";
import type { StorefrontSettings } from "@/lib/types";

/**
 * Dark, centred contact footer for /vitalplus: heading, contact lines, round social
 * icons, a tagline and the two policy links. Everything comes from the company
 * settings, so a field the admin leaves blank simply does not render.
 */
export function VpFooter({ settings }: { settings?: StorefrontSettings }) {
  const company = settings?.company;
  const social = company?.social;
  const whatsapp = company?.whatsapp?.replace(/\D/g, "");
  const socials = (Object.keys(SOCIAL_PATHS) as SocialKey[]).filter((key) => social?.[key]);

  return (
    <footer className="vp-foot">
      <h2>আমাদের অফিস</h2>

      <ul>
        {company?.address && (
          <li><MapPin aria-hidden />{company.address}</li>
        )}
        {company?.phone && (
          <li>
            <Phone aria-hidden />
            <a href={`tel:${company.phone}`}>{company.phone}</a>
          </li>
        )}
        {company?.email && (
          <li>
            <Mail aria-hidden />
            <a href={`mailto:${company.email}`}>{company.email}</a>
          </li>
        )}
      </ul>

      {(socials.length > 0 || whatsapp) && (
        <div className="vp-foot-social">
          {socials.map((key) => (
            <a key={key} href={social?.[key]} target="_blank" rel="noreferrer noopener" aria-label={key}>
              <svg fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path d={SOCIAL_PATHS[key]} />
              </svg>
            </a>
          ))}
          {whatsapp && (
            <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer noopener" aria-label="WhatsApp">
              <MessageCircle aria-hidden />
            </a>
          )}
        </div>
      )}

      <p className="vp-foot-quote">
        “ <em>আপনাদের বিশ্বাস</em> আমাদের অর্জন ”
      </p>

      <nav className="vp-foot-links">
        <Link href="/terms">টার্মস-এন্ড-কন্ডিশন</Link>
        <Link href="/returns-policy">রিটার্ন/পরিবর্তন – পলিসি</Link>
      </nav>

      <p className="vp-foot-copy">
        © {new Date().getFullYear()} {company?.name ?? "Avyra"}. all rights reserved.
      </p>
    </footer>
  );
}
