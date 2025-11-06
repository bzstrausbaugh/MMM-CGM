function describeArc(x, y, radius, startAngle, endAngle) {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return [
    'M',
    start.x,
    start.y,
    'A',
    radius,
    radius,
    0,
    largeArcFlag,
    0,
    end.x,
    end.y,
  ].join(' ');
}

function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

function setTrending(glucose, trend) {
  const trendingWrapper = document.getElementById('trending-wrapper');
  const trendingArrow = document.getElementById('trending');
  const trendingArrow2 = document.getElementById('trending-2');
  if (glucose === -1 || trend === '') {
    trendingArrow.style.opacity = 0;
    trendingArrow2.style.opacity = 0;
    return;
  } else {
    trendingArrow.style.opacity = 1;
  }
  if (trend === 'DoubleUp' || trend === 'DoubleDown') {
    trendingArrow2.style.opacity = 1;
  } else {
    trendingArrow2.style.opacity = 0;
  }
  if (trend === 'DoubleDown') {
    trendingWrapper.setAttribute('transform', 'rotate(90), translate(35,-83)');
    trendingArrow.setAttribute('transform', 'scale(0.65), translate(-50,0)');
    trendingArrow2.setAttribute('transform', 'scale(0.65), translate(90,0)');
    return;
  }
  if (trend === 'DoubleUp') {
    trendingWrapper.setAttribute('transform', 'rotate(-90), translate(-50,15)');
    trendingArrow.setAttribute('transform', 'scale(0.65), translate(140,0)');
    trendingArrow2.setAttribute('transform', 'scale(0.65), translate(0,0)');
    return;
  }
  if (trend === 'SingleUp') {
    trendingWrapper.setAttribute('transform', 'rotate(-90), translate(-50,15)');
    trendingArrow.setAttribute('transform', 'scale(0.65), translate(140,0)');
    return;
  }
  if (trend === 'SingleDown') {
    trendingWrapper.setAttribute('transform', 'rotate(90), translate(35,-83)');
    trendingArrow.setAttribute('transform', 'scale(0.65), translate(-50,0)');
    return;
  }
  if (trend === 'FourtyFiveUp') {
    trendingWrapper.setAttribute('transform', 'rotate(-45), translate(2,28)');
    trendingArrow.setAttribute('transform', 'scale(0.65), translate(-50,0)');
    return;
  }
  if (trend === 'FourtyFiveDown') {
    trendingWrapper.setAttribute('transform', 'rotate(45), translate(65,-40)');
    trendingArrow.setAttribute('transform', 'scale(0.65), translate(-50,0)');
    return;
  }
  trendingWrapper.setAttribute('transform', 'rotate(0), translate(45,5)');
  trendingArrow.setAttribute('transform', 'scale(0.65), translate(-50,0)');
}

function updateGauge(glucose, trend) {
  const minGlucose = 0;
  const maxGlucose = 400;
  const startAngle = -90;
  const endAngle = 90;
  const range = maxGlucose - minGlucose;
  const angleRange = endAngle - startAngle;

  if (glucose > -1) {
    const glucoseText = document.getElementById('glucose-text');
    const fillArc = document.getElementById('gauge-arc-fill');

    const progress = (glucose - minGlucose) / range;
    const rotationAngle = startAngle + progress * angleRange;

    glucoseText.textContent = `${glucose}`;

    const fillArcPath = describeArc(50, 30, 40, startAngle, rotationAngle);
    fillArc.setAttribute('d', fillArcPath);
    fillArc.setAttribute('stroke', getColor(glucose, minGlucose, maxGlucose));
  } else {
    const glucoseText = document.getElementById('glucose-text');
    const fillArc = document.getElementById('gauge-arc-fill');

    const progress = 1;
    const rotationAngle = startAngle + progress * angleRange;

    glucoseText.textContent = 'NO DATA';

    const fillArcPath = describeArc(50, 30, 40, startAngle, rotationAngle);
    fillArc.setAttribute('d', fillArcPath);
    fillArc.setAttribute('stroke', getColor(glucose, minGlucose, maxGlucose));
  }
  setTrending(glucose, trend);
}

function getColor(value, min, max) {
  if (value === -1) {
    return `hsl(208, 100%, 60%)`;
  }
  const color =
    value < 100
      ? Math.max((1.0 + (value - 100) / (30 - min)) * 120, 0)
      : (1.0 - (value - 100) / (max - 100)) * 120;
  return `hsl(${color}, 100%, 50%)`;
}

Module.register('MMM-CGM', {
  start: function () {
    Log.log('Starting module: ' + this.name);

    this.currentReading = {};
    // Trigger the first request
    this.getCurrentCGMValue(this);
  },

  getCurrentCGMValue: function (_this) {
    // Make the initial request to the helper then set up the timer to perform the updates
    _this.sendSocketNotification('GET_NEW_CGM_VALUE', {
      baseUrl: _this.config.baseUrl,
      username: _this.config.accountName,
      password: _this.config.password,
      applicationId: _this.config.appId,
    });

    setTimeout(
      _this.getCurrentCGMValue,
      _this.config.fetchIntervalInSeconds * 1000,
      _this
    );
  },

  getStyles: function () {
    return ['MMM-CGM.css'];
  },

  getDom: function () {
    const wrapper = document.createElement('div');
    const bgArcPath = describeArc(50, 30, 40, 270, 90);
    const rotationAngle = -90 + 0 * (90 + 90);
    const fillArcPath = describeArc(50, 30, 40, -90, rotationAngle);

    wrapper.id = 'cgm-wrapper';
    wrapper.classList.add('wrapper');
    wrapper.innerHTML = `<div id="gauge-container">
      <svg viewBox="0 -20 100 70" width="${this.config.width || 200}" height="${
      this.config.height || 135
    }">
        <path
          id="gauge-arc-bg"
          d="${bgArcPath}"
          stroke="#fff"
          stroke-width="8"
           shape-rendering="geometricPrecision"
        />

        <path id="gauge-arc-fill" d="${fillArcPath}" stroke="red" stroke-width="8" shape-rendering="geometricPrecision" />

        <text
          id="glucose-text"
          x="48"
          y="30"
          font-family="sans-serif"
          font-size="34"
          text-anchor="middle"
          fill="#fff"
        >
          --
        </text>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 329" width="15" fill='#ffffff' id="trending-wrapper"><path id="trending" style="opacity:0" d="M311.1 233.4c12.5 12.5 12.5 32.8 0 45.3l-192 192c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L243.2 256 73.9 86.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l192 192z" transform="scale(0.65), translate(-50,0)"/><path id="trending-2" style="opacity:0" d="M311.1 233.4c12.5 12.5 12.5 32.8 0 45.3l-192 192c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L243.2 256 73.9 86.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l192 192z" transform="scale(0.65), translate(90,0)"/></svg>

        <text
          x="12"
          y="40"
          font-family="sans-serif"
          font-size="8"
          fill="#fff"
          text-anchor="middle"
        >
          0
        </text>
        <text
          x="88"
          y="40"
          font-family="sans-serif"
          font-size="8"
          fill="#fff"
          text-anchor="middle"
        >
          400
        </text>
      </svg>
    </div>`;
    return wrapper;
  },

  socketNotificationReceived: function (notification, payload) {
    if (
      notification === 'GOT_NEW_CGM_VALUE' &&
      payload.applicationId === this.config.appId
    ) {
      if (payload) {
        updateGauge(payload.glucose, payload.trend);
      }
    }
  },
});
