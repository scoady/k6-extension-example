import { check } from 'k6';
import exec from 'k6/x/exec';
export let options = {
    stages: [
      { target: 1, duration: '10s' },
    ],
    cloud: {
      projectID: 3743283,
      distribution: {
        private: { loadZone: 'scoady-plz', percent: 100 },
      },
    },
  };
export default function () {
  const HOSTS = [
    "amplifi.lan", // My home network VIP
  ];

  // Run traceroute for each host and process the results
  for (const host of HOSTS) {
    console.log(`Running traceroute -U to ${host}...\n`);

    // Run the traceroute command
    const r = exec.command("traceroute", ["-U", "-n", host]);

    // Ensure the command succeeded
    const isSuccess = check(r, {
      "command success": (r) => r != "",
    });

    if (!isSuccess) {
      console.error(`Traceroute failed for ${host}: ${r.err}`);
      continue;
    }

    console.log("Traceroute Output:");
    console.log(r);

    // Parse and process traceroute output
    const metrics = parseTraceroute(r);
    console.log(`Metrics for ${host}:`);
    console.log(JSON.stringify(metrics, null, 2));

    // Example: Store metrics or push to a monitoring system
    // You can replace this with actual metrics handling
  }
}
function parseTraceroute(output) {
    console.log("output: ", output);
  
    const lines = output.split("\n").slice(1); // Skip the first line (header)
    const metrics = {
      hops: [],
      totalHops: 0,
    };
  
    for (const line of lines) {
      if (line.trim() === "") continue;
  
      console.log("line: ", line);
  
      // Split the line by whitespace
      const parts = line.trim().split(/\s+/);
  
      if (parts.length >= 5) {
        // Extract data based on column positions
        const hopNumber = parseInt(parts[0], 10); // Column 0: Hop number
        const ip = parts[1]; // Column 1: IP address or hostname
  
        // Extract RTTs from specific columns (2, 4, 6)
        const rtts = [parts[2], parts[4], parts[6]].map((rtt) =>
          rtt ? parseFloat(rtt) : null
        );
  
        // Calculate average RTT if valid RTTs exist
        const validRtts = rtts.filter((rtt) => rtt !== null);
        const avgRtt =
          validRtts.length > 0
            ? validRtts.reduce((sum, rtt) => sum + rtt, 0) / validRtts.length
            : null;
  
        // Add the hop to metrics
        metrics.hops.push({
          hop: hopNumber,
          ip,
          rtts,
          avgRtt,
        });
      }
    }
  
    metrics.totalHops = metrics.hops.length;
    return metrics;
  }
  
