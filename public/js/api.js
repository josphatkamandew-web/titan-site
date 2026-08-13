// Shared fetch wrapper. window.TITAN_API_BASE is injected at build time
// by build-config.js from the TITAN_API_BASE Netlify environment variable.

const Titan = (() => {
  const base = () => window.TITAN_API_BASE || "http://localhost:8000";

  async function request(path, options = {}) {
    const url = `${base()}${path}`;
    let res;
    try {
      res = await fetch(url, {
        headers: { "Content-Type": "application/json" },
        ...options,
      });
    } catch (err) {
      throw new TitanApiError(`Could not reach backend at ${base()}. Is it deployed and running? (${err.message})`, 0);
    }
    if (!res.ok) {
      let detail = res.statusText;
      try {
        const body = await res.json();
        detail = body.detail || JSON.stringify(body);
      } catch (_) {}
      throw new TitanApiError(detail, res.status);
    }
    return res.json();
  }

  class TitanApiError extends Error {
    constructor(message, status) {
      super(message);
      this.status = status;
    }
  }

  return {
    getAnalysis: (instrument, timeframe = "M15") =>
      request(`/analysis/${instrument}?timeframe=${timeframe}`),
    getValidation: (instrument) => request(`/validation/${instrument}`),
    runBacktest: (instrument, body) =>
      request(`/backtest/${instrument}`, { method: "POST", body: JSON.stringify(body) }),
    getDataHealth: (instrument, timeframe = "M15") =>
      request(`/data-health/${instrument}?timeframe=${timeframe}`),
    postJournal: (entry) => request(`/journal`, { method: "POST", body: JSON.stringify(entry) }),
    getJournal: (instrument) => request(`/journal?instrument=${instrument}`),
    getCalibration: (instrument) => request(`/calibration/${instrument}`),
    ApiError: TitanApiError,
  };
})();
