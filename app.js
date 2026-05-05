const input = document.getElementById('query');
const btn = document.getElementById('go');
const spinner = document.getElementById('spinner');
const card = document.getElementById('card');
const placeholder = document.getElementById('placeholder');
const imgEl = document.getElementById('result-image');
const titleEl = document.getElementById('title');
const extractEl = document.getElementById('extract');
const readmoreEl = document.getElementById('readmore');

function showSpinner(show){
  spinner.hidden = !show;
  spinner.setAttribute('aria-hidden', String(!show));
}
function showCard(show){
  card.hidden = !show;
  placeholder.style.display = show ? 'none' : '';
}

async function fetchWikipedia(title){
  const encoded = encodeURIComponent(title.trim());
  if(!encoded) throw new Error('empty');

  // 1) Quick summary via REST (gives thumbnail if available)
  const restUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encoded}`;
  const restResp = await fetch(restUrl);
  if(!restResp.ok) {
    const txt = await restResp.text();
    throw new Error('Not found');
  }
  const restJson = await restResp.json();

  // 2) Full extract and page image via action API (plaintext)
  const queryUrl = `https://en.wikipedia.org/w/api.php?` +
    `origin=*&format=json&action=query&prop=extracts|pageimages&explaintext=1&exintro=0&piprop=thumbnail&pithumbsize=800&titles=${encoded}`;

  const qResp = await fetch(queryUrl);
  const qJson = await qResp.json();

  const pages = qJson.query && qJson.query.pages;
  const page = pages && pages[Object.keys(pages)[0]];

  const extract = (page && page.extract) || restJson.extract || '';
  const thumbnail = (page && page.thumbnail && page.thumbnail.source) || (restJson && restJson.thumbnail && restJson.thumbnail.source) || '';

  const pageUrl = restJson.content_urls && restJson.content_urls.desktop && restJson.content_urls.desktop.page
    ? restJson.content_urls.desktop.page
    : `https://en.wikipedia.org/wiki/${encoded}`;

  const displayTitle = restJson.title || (page && page.title) || title;

  return { title: displayTitle, extract, thumbnail, pageUrl };
}

function setResult({title, extract, thumbnail, pageUrl}){
  titleEl.textContent = title || '';
  extractEl.textContent = extract || 'No description available.';
  readmoreEl.href = pageUrl;
  readmoreEl.hidden = !pageUrl;

  if(thumbnail){
    imgEl.src = thumbnail;
    imgEl.alt = `${title} image`;
    imgEl.style.display = '';
  } else {
    imgEl.style.display = 'none';
    imgEl.src = '';
  }

  showCard(true);
}

async function doSearch(q){
  try{
    showSpinner(true);
    showCard(false);
    const res = await fetchWikipedia(q);
    setResult(res);
  }catch(err){
    placeholder.innerHTML = `<div class="hint">No results found for that query.</div>`;
    showCard(false);
  }finally{
    showSpinner(false);
  }
}

btn.addEventListener('click', () => {
  const v = input.value.trim();
  if(!v) return;
  doSearch(v);
});

// Enter key on input
input.addEventListener('keydown', (e) => {
  if(e.key === 'Enter'){
    const v = input.value.trim();
    if(!v) return;
    doSearch(v);
  }
});

// quick demo fill on load (optional): empty so no automatic query
// input.value = 'Mount Everest';