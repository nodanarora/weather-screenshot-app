import React, { useState } from 'react';

export default function App(){
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastAt, setLastAt] = useState(null);

  async function refresh() {
    setLoading(true);
    try {
      const res = await fetch('/api/screenshot');
      const data = await res.json();
      setImages(data);
      setLastAt(new Date().toLocaleString());
    } catch (e) {
      console.error(e);
      setImages([{ site: 'error', error: e.message }]);
    }
    setLoading(false);
  }

  return (
    <div className="container">
      <header>
        <h1>Hourly forecast screenshots</h1>
        <div className="controls">
          <button onClick={refresh} className="btn">{loading ? '更新中…' : '更新'}</button>
          <div className="last">{ lastAt ? `最終更新: ${lastAt}` : '' }</div>
        </div>
        <p className="note">対象: tenki.jp / Weathernews / NHK / Yahoo — 予報部分のみを切り出しています。</p>
      </header>

      <main>
        <div className="grid">
          {images.map((img) => (
            <div key={img.site} className="card">
              <div className="card-header">
                <strong>{img.site}</strong>
                <a href={img.url} target="_blank" rel="noreferrer">source</a>
              </div>
              <div className="card-body">
                {img.image ? (
                  <img src={img.image} alt={img.site} />
                ) : (
                  <div className="err">error: {img.error}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
