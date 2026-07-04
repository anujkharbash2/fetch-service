const { fetchPage } = require('./fetchPage');

(async () => {
  const urls = [
    'https://sau.int', //university home page
    'https://www.amazon.in/CHAIR-KING-Premium-Armrest-Restaurents/dp/B0GGBV6X6T/?_encoding=UTF8&pd_rd_w=HdUFl&content-id=amzn1.sym.f53e1799-ea87-44ad-8644-6afb63ff33a7&pf_rd_p=f53e1799-ea87-44ad-8644-6afb63ff33a7&pf_rd_r=XD625JM4BA6SS4R34T1K&pd_rd_wg=umbIq&pd_rd_r=cb6577a1-1f70-47fa-9c15-ada5d835abb2&ref_=pd_hp_d_btf_NAMBOTTLES&th=1', // a real product page
    'https://this-domain-does-not-exist-xyz123.com', // should fail cleanly
  ];

  for (const url of urls) {
    const result = await fetchPage(url);
    console.log(url, '→', {
      status: result.statusCode,
      ms: result.renderTimeMs,
      htmlLen: result.html ? result.html.length : 0,
      error: result.error,
    });
  }
})();