export default function PrivacyPage() {
  return (
    <main className="page-shell narrow-page">
      <section className="panel">
        <div className="panel-body">
          <p className="landing-eyebrow">WartoMetr</p>
          <h1>Privacy and listing import</h1>
          <p>
            We fetch only the public listing URL you submit and extract apartment parameters
            needed for the analysis. Photos, contacts and the full description are not retained.
          </p>
          <p>
            A private draft may keep the source reference and analysis result for the selected
            retention period. You can delete the draft from My apartments at any time.
          </p>
          <p>
            If automatic import is blocked or unsupported, no listing page is retained. Continue
            with manual entry and provide only the fields you want analysed.
          </p>
        </div>
      </section>
    </main>
  );
}
