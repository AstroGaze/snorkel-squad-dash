import { mutation } from './_generated/server';
import { v } from 'convex/values';

const startOfDay = (timestamp: number) => {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
};

const RESERVATION_TYPES = ['Venta directa', 'Online', 'Hotel', 'Agencia'];

export const generateRandomReservation = mutation({
  args: {},
  handler: async (ctx) => {
    const operators = await ctx.db.query('operators').collect();
    
    if (operators.length === 0) {
      throw new Error('No hay operadores registrados para generar datos.');
    }

    const now = new Date();
    const todayStart = startOfDay(now.getTime());

    // Fetch today's reservations to calculate current load
    const reservationsToday = await ctx.db
      .query('reservations')
      .withIndex('by_day', (q) => q.eq('dayKey', todayStart))
      .collect();

    // Calculate load for each operator
    const operatorStats = operators.map((op) => {
      const clientesHoy = reservationsToday
        .filter((r) => r.operadorId === op._id)
        .reduce((acc, r) => acc + r.personas, 0);
      
      const load = op.capacidadTotal > 0 ? clientesHoy / op.capacidadTotal : Infinity;
      const slack = op.capacidadTotal - clientesHoy;

      return { ...op, clientesHoy, load, slack };
    });

    // Random group size 1-6 (weighted slightly towards 2-4)
    const r = Math.random();
    let personas: number;
    if (r < 0.15) personas = 1;
    else if (r < 0.75) personas = Math.floor(Math.random() * 3) + 2; // 2-4
    else personas = Math.floor(Math.random() * 2) + 5; // 5-6

    // Filter eligible operators (must have enough capacity)
    const eligibleOperators = operatorStats.filter(op => op.slack >= personas);

    if (eligibleOperators.length === 0) {
      throw new Error(`No hay operadores con capacidad suficiente para ${personas} personas.`);
    }

    // Select best operator using Least Loaded algorithm
    const operator = eligibleOperators.reduce((best, current) => {
      // 1. Primary: Least Load %
      if (current.load !== best.load) {
        return current.load < best.load ? current : best;
      }

      // 2. Secondary: Most Slack (Absolute seats available)
      if (current.slack !== best.slack) {
        return current.slack > best.slack ? current : best;
      }

      // 3. Tertiary: Alphabetical
      return current.nombre.localeCompare(best.nombre) < 0 ? current : best;
    }, eligibleOperators[0]);
    
    // Random time between 8:00 and 16:00
    // Weighted towards morning (8-11)
    let hour;
    if (Math.random() < 0.6) {
      hour = Math.floor(Math.random() * 4) + 8; // 8, 9, 10, 11
    } else {
      hour = Math.floor(Math.random() * 5) + 12; // 12, 13, 14, 15, 16
    }
    const minute = Math.random() < 0.5 ? '00' : '30';
    const horaSalida = `${hour.toString().padStart(2, '0')}:${minute}`;

    // Construct timestamp for this reservation
    const reservationDate = new Date(todayStart);
    reservationDate.setHours(hour, parseInt(minute));
    
    // Random type
    const tipo = RESERVATION_TYPES[Math.floor(Math.random() * RESERVATION_TYPES.length)];

    const reservation = {
      operadorId: operator._id,
      personas,
      tipo,
      timestamp: reservationDate.toISOString(),
      horaSalida,
      dayKey: todayStart,
    };

    const id = await ctx.db.insert('reservations', reservation);

    return { 
      id,
      operatorName: operator.nombre,
      ...reservation
    };
  },
});
