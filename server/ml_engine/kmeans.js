/**
 * K-Means Multi-Dimensional Clustering Engine for Coimbatore Cadastral Parcels
 * Analyzes risk profiles, valuation per sq ft, and geographic clustering
 */

function euclideanDistance(pointA, pointB) {
  let sum = 0;
  for (let i = 0; i < pointA.length; i++) {
    const diff = pointA[i] - pointB[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

// Min-Max feature normalizer so features with large scales (price) don't overpower (risk_score)
function normalizeFeatures(dataMatrix) {
  const numFeatures = dataMatrix[0].length;
  const mins = new Array(numFeatures).fill(Infinity);
  const maxs = new Array(numFeatures).fill(-Infinity);

  dataMatrix.forEach(row => {
    row.forEach((val, col) => {
      if (val < mins[col]) mins[col] = val;
      if (val > maxs[col]) maxs[col] = val;
    });
  });

  const normalized = dataMatrix.map(row =>
    row.map((val, col) => {
      const range = maxs[col] - mins[col];
      return range === 0 ? 0 : (val - mins[col]) / range;
    })
  );

  return { normalized, mins, maxs };
}

export function runKMeansClustering(lands, k = 3, maxIterations = 50) {
  if (!lands || lands.length === 0) return { clusters: [], centroids: [] };

  // Feature vector extraction:
  // [guideline_value, market_value, risk_score, active_cases, area_sq_ft]
  const rawFeatures = lands.map(land => [
    land.guideline_value_per_sqft || 500,
    land.market_value_per_sqft || 600,
    land.risk_score || 20,
    land.active_cases || 0,
    Math.log10(land.area_sq_ft || 10000)
  ]);

  const { normalized } = normalizeFeatures(rawFeatures);
  const actualK = Math.min(k, lands.length);

  // Initialize centroids deterministically using spread out indices
  let centroids = [];
  const step = Math.floor(normalized.length / actualK);
  for (let i = 0; i < actualK; i++) {
    const idx = (i * step) % normalized.length;
    centroids.push([...normalized[idx]]);
  }

  let assignments = new Array(normalized.length).fill(0);
  let iteration = 0;
  let converged = false;

  while (iteration < maxIterations && !converged) {
    let changed = false;

    // Assignment step
    for (let i = 0; i < normalized.length; i++) {
      let minDist = Infinity;
      let closestCluster = 0;

      for (let c = 0; c < actualK; c++) {
        const dist = euclideanDistance(normalized[i], centroids[c]);
        if (dist < minDist) {
          minDist = dist;
          closestCluster = c;
        }
      }

      if (assignments[i] !== closestCluster) {
        assignments[i] = closestCluster;
        changed = true;
      }
    }

    // Update step
    const newCentroids = Array.from({ length: actualK }, () =>
      new Array(normalized[0].length).fill(0)
    );
    const counts = new Array(actualK).fill(0);

    for (let i = 0; i < normalized.length; i++) {
      const clusterIdx = assignments[i];
      counts[clusterIdx]++;
      for (let f = 0; f < normalized[i].length; f++) {
        newCentroids[clusterIdx][f] += normalized[i][f];
      }
    }

    for (let c = 0; c < actualK; c++) {
      if (counts[c] > 0) {
        for (let f = 0; f < newCentroids[c].length; f++) {
          newCentroids[c][f] /= counts[c];
        }
      } else {
        // If an empty cluster happens, re-seed with a random point
        newCentroids[c] = [...normalized[iteration % normalized.length]];
      }
    }

    centroids = newCentroids;
    if (!changed) converged = true;
    iteration++;
  }

  // Calculate cluster inertia (sum of squared distances to centroid)
  let inertia = 0;
  for (let i = 0; i < normalized.length; i++) {
    const cIdx = assignments[i];
    const dist = euclideanDistance(normalized[i], centroids[cIdx]);
    inertia += dist * dist;
  }

  // Assemble cluster details & meaningful domain descriptions
  const clusters = Array.from({ length: actualK }, (_, cIdx) => {
    const clusterLands = lands.filter((_, i) => assignments[i] === cIdx);
    const avgRisk = clusterLands.length > 0
      ? Math.round(clusterLands.reduce((acc, l) => acc + (l.risk_score || 0), 0) / clusterLands.length)
      : 0;
    const avgPrice = clusterLands.length > 0
      ? Math.round(clusterLands.reduce((acc, l) => acc + (l.market_value_per_sqft || 0), 0) / clusterLands.length)
      : 0;

    let tier = "Moderate Investment Tier";
    let badgeColor = "#3b82f6";
    if (avgRisk < 25 && avgPrice > 1500) {
      tier = "Prime Tech Corridor / Institutional Grade";
      badgeColor = "#10b981";
    } else if (avgRisk >= 60) {
      tier = "High Legal Risk / Encumbered Assets";
      badgeColor = "#ef4444";
    } else if (avgPrice < 600) {
      tier = "Suburban Growth / Agri-Industrial Belt";
      badgeColor = "#f59e0b";
    }

    return {
      clusterId: cIdx,
      title: `Cluster ${cIdx + 1}: ${tier}`,
      badgeColor,
      parcelsCount: clusterLands.length,
      averageRiskScore: avgRisk,
      averageMarketValuePerSqFt: avgPrice,
      parcels: clusterLands.map(l => ({
        id: l.id,
        survey_number: l.survey_number,
        location: l.location,
        risk_score: l.risk_score,
        market_value_per_sqft: l.market_value_per_sqft,
        status: l.status
      }))
    };
  });

  return {
    algorithm: "K-Means Multi-Dimensional Cadastral Clustering",
    k: actualK,
    iterations: iteration,
    converged,
    inertia: parseFloat(inertia.toFixed(4)),
    totalAnalyzed: lands.length,
    clusters
  };
}
