import { getUncachableStripeClient } from "./stripeClient";

/**
 * Script para crear los productos y precios de CATEDRALX en Stripe.
 * Idempotente — verifica existencia antes de crear.
 * Ejecutar: pnpm --filter @workspace/scripts exec tsx src/seed-products.ts
 */
async function crearProductos() {
  const stripe = await getUncachableStripeClient();

  console.log("🔑 Conectando a Stripe...");

  const tiers = [
    {
      nombre: "Operador",
      descripcion: "20 señales/día · Paper trading · Acceso al motor de señales",
      monto: 2900,
      tier: "operador",
    },
    {
      nombre: "Soberano",
      descripcion: "Señales ilimitadas · AI Córtex (3 lóbulos) · Sistema nervioso · Acceso total",
      monto: 9900,
      tier: "soberano",
    },
  ];

  for (const t of tiers) {
    const existentes = await stripe.products.search({
      query: `name:'${t.nombre}' AND active:'true'`,
    });

    if (existentes.data.length > 0) {
      console.log(`✓ Producto '${t.nombre}' ya existe (${existentes.data[0].id})`);
      continue;
    }

    const producto = await stripe.products.create({
      name: t.nombre,
      description: t.descripcion,
      metadata: { tier: t.tier, app: "catedralx" },
    });
    console.log(`✓ Producto creado: ${producto.name} (${producto.id})`);

    const precio = await stripe.prices.create({
      product: producto.id,
      unit_amount: t.monto,
      currency: "usd",
      recurring: { interval: "month" },
      metadata: { tier: t.tier },
    });
    console.log(`  └─ Precio: $${t.monto / 100}/mes (${precio.id})`);
  }

  console.log("\n✅ Productos CATEDRALX listos en Stripe.");
  console.log("Los webhooks sincronizarán los datos automáticamente.");
}

crearProductos().catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});
