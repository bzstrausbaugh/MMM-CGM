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
  const correction = glucose < 100 ? 3 : 0;
  const trendingArrow = document.getElementById('trending');
  console.log('trend', trend);
  if (trend === 'DoubleUp' || trend === 'SingleUp') {
    trendingArrow.setAttribute('transform', `translate(${45 - correction},52)`);
  } else if (trend === 'FortyFiveUp') {
    trendingArrow.setAttribute(
      'transform',
      `translate(${60 - correction},8) rotate(45)`
    );
  } else if (trend === 'Flat') {
    trendingArrow.setAttribute(
      'transform',
      `translate(${75 - correction},13) rotate(90)`
    );
  } else if (trend === 'FortyFiveDown') {
    trendingArrow.setAttribute(
      'transform',
      `translate(${77 - correction},25) rotate(135)`
    );
  } else if (trend === 'DoubleDown' || trend === 'SingleDown') {
    trendingArrow.setAttribute(
      'transform',
      `translate(${73 - correction},37) rotate(180)`
    );
  }
}

function updateGauge(glucose, trend) {
  const minGlucose = 0;
  const maxGlucose = 400;
  const startAngle = -90;
  const endAngle = 90;
  const range = maxGlucose - minGlucose;
  const angleRange = endAngle - startAngle;

  const glucoseText = document.getElementById('glucose-text');
  const fillArc = document.getElementById('gauge-arc-fill');

  const progress = (glucose - minGlucose) / range;
  const rotationAngle = startAngle + progress * angleRange;

  glucoseText.textContent = `${glucose}`;

  const fillArcPath = describeArc(50, 30, 40, startAngle, rotationAngle);
  fillArc.setAttribute('d', fillArcPath);
  fillArc.setAttribute('stroke', getColor(glucose, minGlucose, maxGlucose));

  setTrending(glucose, trend);
}

function getColor(value, min, max) {
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
          x="40"
          y="30"
          font-family="sans-serif"
          font-size="12"
          text-anchor="middle"
          fill="#fff"
        >
          --
        </text>

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

        <path
          id="trending"
          d="M7.03 9.97H11.03V18.89L13.04 18.92V9.97H17.03L12.03 4.97Z"
          fill="#fff"
          transform="translate(42,12)"
        />

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
