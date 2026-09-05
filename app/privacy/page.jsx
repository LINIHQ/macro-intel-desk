export const metadata = {
  title: 'Privacy | GenXKrypto XRP Macro Intelligence Desk',
};

export default function PrivacyPage() {
  return (
    <div>
      <h1>Privacy</h1>
      <p className="page-sub">
        What this site collects, what it does not, and who touches it. Short version: no accounts, no ads, no
        trackers, no cookies, and nothing sold to anyone. Effective September 5, 2026.
      </p>

      <h2>Who is responsible</h2>
      <p>
        The XRP Macro Intelligence Desk is built and run independently by an individual operator, GenXKrypto. There is
        no company behind it. For privacy questions, contact{' '}
        <a href="mailto:support@genxkrypto.com">support@genxkrypto.com</a>.
      </p>

      <h2>The short version</h2>
      <div className="card">
        <p style={{ margin: '0 0 10px' }}>
          There are no user accounts, no logins, and no email signup. Nothing on this site asks for your name, email
          address, or any other identifying detail.
        </p>
        <p style={{ margin: '0 0 10px' }}>
          This site sets no cookies. That is why you do not see a cookie banner: there is nothing to consent to.
        </p>
        <p style={{ margin: '0 0 10px' }}>
          There are no ads, no advertising pixels, no affiliate links, no social media tracking widgets, and no
          third-party analytics scripts.
        </p>
        <p style={{ margin: 0 }}>
          No data from this site is sold, rented, or shared with anyone for marketing purposes. Ever.
        </p>
      </div>

      <h2>Traffic measurement</h2>
      <p>
        The site uses Vercel Web Analytics to count visits. It is cookieless. Instead of storing an identifier on your
        device, it derives a temporary hash from the incoming request, and that hash is discarded after 24 hours. It
        does not follow you across other websites and does not build a profile of you.
      </p>
      <p>
        What that produces for the desk is aggregate only: how many people visited, which pages they opened, the
        referring site, device type, browser, operating system, and a country-level location derived from network
        information. There is no way to look at that data and identify an individual reader, and no attempt is made to
        do so.
      </p>
      <p>
        Vercel also keeps standard server request logs, the same kind every web host keeps, as part of operating the
        infrastructure. Those belong to Vercel, are not used by the desk for analysis, and are not published anywhere.
      </p>

      <h2>Brief alerts</h2>
      <p>
        Brief alerts are entirely optional and off by default. If you install the site as an app and turn them on,
        your browser generates a push subscription and sends the desk three technical values: an endpoint URL supplied
        by your browser vendor's push service, and two cryptographic keys used to encrypt the notification. That is
        all that is stored. No email address, no device name, no identity, and nothing tying the subscription to a
        person.
      </p>
      <p>
        Those values are used for one purpose: sending a notification when a new brief publishes. They are never used
        for anything else and are never shared.
      </p>
      <p>
        The database is configured so that the public site can add a subscription but cannot read subscriptions back,
        including its own. Turning the toggle off unsubscribes your device immediately, and the stored record is
        removed automatically the next time a notification attempt finds the endpoint dead.
      </p>

      <h2>Reading the site requires nothing from you</h2>
      <p>
        Briefs, claims, watch items, history, and sources are public and readable without identifying yourself in any
        way. The XRPL amendments table shown on the Watch page is fetched by the desk's server, not by your browser,
        so loading that page does not expose your device to the data provider.
      </p>

      <h2>Who processes data on the desk's behalf</h2>
      <p>
        <strong>Vercel</strong> hosts the site and provides the traffic measurement described above.{' '}
        <strong>Supabase</strong> provides the database that stores published briefs and, if you opt in, push
        subscriptions. Both are United States based infrastructure providers operating under their own privacy terms.
        No other third party receives anything.
      </p>

      <h2>If you are in the EU, UK, or a similar jurisdiction</h2>
      <p>
        You have rights of access, correction, deletion, and objection regarding personal data about you. In practice
        the desk holds almost nothing that could be linked to you: analytics data is aggregated and cannot be traced
        back to an individual, and a push subscription record contains no identifying information.
      </p>
      <p>
        If you enabled brief alerts and want the subscription removed rather than left to expire, turn the toggle off
        and email <a href="mailto:support@genxkrypto.com">support@genxkrypto.com</a>, and it will be deleted. For
        anything else, ask, and you will get an honest answer about what does or does not exist.
      </p>

      <h2>Children</h2>
      <p>
        This site publishes financial and macroeconomic analysis for an adult audience. It is not directed at
        children, and it does not knowingly collect information from them.
      </p>

      <h2>Changes</h2>
      <p>
        If the data practices described here change, this page changes with them and the effective date at the top is
        updated. If the desk ever adds something material, an analytics change, a monetization feature, anything that
        collects more than it does today, it will be stated plainly here rather than quietly folded in.
      </p>
    </div>
  );
}
