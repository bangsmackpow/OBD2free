// OBD2 PID Parsing Tests

describe("OBD2 PID Parsing", () => {
  test("parses RPM correctly", () => {
    // Response: "41 0C 1A F8"
    const response = "41 0C 1A F8";
    // Simulate parsing: ((A*256)+B)/4
    // A=0x1A=26, B=0xF8=248 => (26*256+248)/4 = (6656+248)/4 = 6904/4=1726 RPM
    const bytes = response.trim().split(" ");
    const payload = bytes.slice(2); // skip mode and pid
    const a = parseInt(payload[0], 16);
    const b = parseInt(payload[1], 16);
    const rpm = (a * 256 + b) / 4;
    expect(rpm).toBeCloseTo(1726, 0);
  });

  test("parses vehicle speed", () => {
    const response = "41 0D 3C";
    const bytes = response.trim().split(" ");
    const speed = parseInt(bytes[2], 16);
    expect(speed).toBe(60); // 0x3C = 60 km/h
  });

  test("parses coolant temperature", () => {
    const response = "41 05 7B";
    const bytes = response.trim().split(" ");
    const temp = parseInt(bytes[2], 16) - 40;
    expect(temp).toBe(83); // 0x7B=123 - 40 = 83°C
  });
});
