import Link from "next/link";
import { AccessibilityTools } from "./accessibility-tools";

const features = [
  { icon: "01", title: "Discover support", text: "Find accessible services, education, training and scholarships by location and need." },
  { icon: "02", title: "See your matches", text: "Understand why an opportunity may fit your profile, including missing information and conflicts." },
  { icon: "03", title: "Move forward", text: "Request referrals, track applications and follow every update through a clear timeline." },
];

const opportunities = [
  { type: "Support service", title: "Community Physiotherapy Programme", org: "Shobuj Pathways Foundation", mode: "In person", location: "Dhaka", match: "Strong match" },
  { type: "Inclusive job", title: "Junior Customer Support Associate", org: "BrightDesk Bangladesh", mode: "Hybrid", location: "Dhaka", match: "89% match" },
  { type: "Training", title: "Accessible Digital Skills Bootcamp", org: "Uddipan Learning Collective", mode: "Online", location: "Nationwide", match: "Good match" },
];

function Brand() {
  return (
    <Link className="brand" href="/" aria-label="B-SCAN Connect home">
      <span className="brand-mark" aria-hidden="true">B</span>
      <span><strong>B-SCAN</strong><small>Connect</small></span>
    </Link>
  );
}

export default function Home() {
  return (
    <>
      <header className="site-header">
        <div className="shell header-inner">
          <Brand />
          <nav className="public-nav" aria-label="Primary navigation">
            <Link href="/discover?kind=service">Services</Link>
            <Link href="/discover?kind=job">Jobs</Link>
            <Link href="/discover?kind=training">Education & training</Link>
            <a href="#how-it-works">How it works</a>
          </nav>
          <div className="header-actions">
            <AccessibilityTools />
            <Link className="text-link" href="/workspace">Sign in</Link>
            <Link className="button button-small" href="/workspace">Open workspace</Link>
          </div>
        </div>
      </header>

      <main id="main-content">
        <section className="hero">
          <div className="shell hero-grid">
            <div className="hero-copy">
              <p className="eyebrow"><span /> Support. Skills. Opportunities. Connected.</p>
              <h1>Find the support and opportunities that fit <em>your goals.</em></h1>
              <p className="hero-lead">B-SCAN Connect brings accessible services, inclusive jobs, education and referrals into one clear journey—designed around informed choice.</p>
              <div className="hero-actions">
                <Link className="button" href="/workspace">View personalized matches <span aria-hidden="true">→</span></Link>
                <Link className="button button-secondary" href="/discover">Browse opportunities</Link>
              </div>
              <div className="trust-row" aria-label="Platform principles">
                <span>✓ Voluntary disclosure</span>
                <span>✓ Explainable matches</span>
                <span>✓ Accessible by design</span>
              </div>
            </div>

            <div className="hero-panel" aria-label="Example personalized dashboard">
              <div className="mini-window">
                <div className="mini-topbar"><span /><span /><span /><b>My dashboard</b></div>
                <div className="profile-row">
                  <div className="avatar" aria-hidden="true">NS</div>
                  <div><small>Welcome back</small><strong>Nadia Sultana</strong></div>
                  <div className="profile-score"><b>78%</b><small>Profile ready</small></div>
                </div>
                <div className="mini-stat-grid">
                  <div><span className="stat-icon">✦</span><b>12</b><small>New matches</small></div>
                  <div><span className="stat-icon">↗</span><b>3</b><small>Active referrals</small></div>
                  <div><span className="stat-icon">▣</span><b>4</b><small>Applications</small></div>
                </div>
                <div className="match-card">
                  <div className="match-head"><span className="match-label">Top match</span><b>92%</b></div>
                  <h3>Accessible Digital Skills Bootcamp</h3>
                  <p>Online · Uddipan Learning Collective</p>
                  <div className="reason-tags"><span>Matches your skills</span><span>Online delivery</span></div>
                  <button type="button">See why it matches <span aria-hidden="true">→</span></button>
                </div>
              </div>
              <div className="floating-note note-one"><span>✓</span><div><b>Referral accepted</b><small>Appointment proposed</small></div></div>
              <div className="floating-note note-two"><span>★</span><div><b>New job match</b><small>89% profile match</small></div></div>
            </div>
          </div>
        </section>

        <section className="impact-strip" aria-label="Platform overview">
          <div className="shell impact-grid">
            <div><strong>12</strong><span>Partner organizations</span></div>
            <div><strong>24</strong><span>Support services</span></div>
            <div><strong>15</strong><span>Inclusive jobs</span></div>
            <div><strong>10</strong><span>Learning opportunities</span></div>
          </div>
        </section>

        <section className="section" id="how-it-works">
          <div className="shell">
            <div className="section-heading centered">
              <p className="eyebrow"><span /> One connected journey</p>
              <h2>From discovering support to reaching an outcome</h2>
              <p>Each step stays understandable, visible and under the user’s control.</p>
            </div>
            <div className="feature-grid">
              {features.map((feature) => (
                <article className="feature-card" key={feature.icon}>
                  <span className="feature-number">{feature.icon}</span>
                  <div className="feature-symbol" aria-hidden="true">{feature.icon === "01" ? "⌕" : feature.icon === "02" ? "✦" : "↗"}</div>
                  <h3>{feature.title}</h3>
                  <p>{feature.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section soft-section" id="opportunities">
          <div className="shell">
            <div className="section-heading split-heading">
              <div><p className="eyebrow"><span /> Featured listings</p><h2>Opportunities worth exploring</h2></div>
              <Link className="text-link arrow-link" href="/discover">View all listings →</Link>
            </div>
            <div className="opportunity-grid">
              {opportunities.map((item, index) => (
                <article className="opportunity-card" key={item.title}>
                  <div className={`opportunity-icon icon-${index + 1}`} aria-hidden="true">{index === 0 ? "+" : index === 1 ? "▤" : "⌁"}</div>
                  <div className="opportunity-top"><span>{item.type}</span><b>{item.match}</b></div>
                  <h3>{item.title}</h3>
                  <p>{item.org}</p>
                  <div className="listing-meta"><span>{item.location}</span><span>{item.mode}</span></div>
                  <Link href="/discover" aria-label={`View ${item.title}`}>View details <span aria-hidden="true">→</span></Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section roles-section" id="services">
          <div className="shell roles-grid">
            <div className="roles-copy">
              <p className="eyebrow light"><span /> Built for coordination</p>
              <h2>One platform, shared progress</h2>
              <p>Every stakeholder sees the right actions, history and next steps—without exposing unrelated private information.</p>
              <Link className="button button-light" href="/workspace">Explore stakeholder dashboards →</Link>
            </div>
            <div className="role-list">
              {[
                ["PwD user", "Discover, save, request and track"],
                ["Referral officer", "Review, coordinate and follow up"],
                ["Organization", "Respond, schedule and update outcomes"],
                ["Administrator", "Publish, oversee and improve"],
              ].map(([title, text], i) => (
                <div className="role-row" key={title}><span>0{i + 1}</span><div><b>{title}</b><small>{text}</small></div><i aria-hidden="true">→</i></div>
              ))}
            </div>
          </div>
        </section>

        <section className="section final-cta">
          <div className="shell cta-card">
            <div><p className="eyebrow"><span /> Ready to explore?</p><h2>See the complete stakeholder journey.</h2><p>Switch between stakeholder roles and follow referrals, applications and approvals.</p></div>
            <Link className="button" href="/workspace">Open stakeholder workspace →</Link>
          </div>
        </section>
      </main>

      <footer>
        <div className="shell footer-inner"><Brand /><p>Accessible support and opportunity coordination</p><div><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><a href="#main-content">Back to top ↑</a></div></div>
      </footer>
    </>
  );
}
