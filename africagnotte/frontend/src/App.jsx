// ─── App principale ───────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <Nav />
      <Routes>
        <Route path="/"                element={<Home />} />
        <Route path="/explorer"        element={<Explorer />} />
        <Route path="/cagnotte/:slug"  element={<CampaignDetail />} />
        <Route path="/creer"           element={<Create />} />
        <Route path="/dashboard"       element={<Dashboard />} />
        <Route path="/connexion"       element={<Connexion />} />
        <Route path="/inscription"     element={<Inscription />} />
        <Route path="/payment/success" element={<PaymentSuccess />} />
        <Route path="*"                element={<NotFound />} />
      </Routes>
      <footer style={{ background: '#085041', color: 'rgba(255,255,255,.8)', padding: '2rem', textAlign: 'center', fontSize: 13, marginTop: '4rem' }}>
        <strong style={{ color: '#fff' }}>AfriCagnotte</strong> — La cagnotte solidaire de l'Afrique Centrale<br />
        <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '.75rem' }}>
          {['🇨🇲 Cameroun','🇨🇩 RDC','🇬🇦 Gabon','🇨🇬 Congo','🇨🇫 RCA','🇬🇶 Guinée Éq.','🇹🇩 Tchad'].map(c => <span key={c}>{c}</span>)}
        </div>
      </footer>
    </BrowserRouter>
  )
}
