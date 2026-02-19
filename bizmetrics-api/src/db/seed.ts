import { env } from '../config/env.js';
import { db } from '../config/database.js';
import { users, sales, uploadBatches } from './schema.js';
import bcrypt from 'bcrypt';

async function seed() {
  console.log('Seeding database...');

  // Create demo user
  const passwordHash = await bcrypt.hash('Demo1234', 12);
  const user = db
    .insert(users)
    .values({
      name: 'Usuário Demo',
      email: 'demo@bizmetrics.com',
      passwordHash,
      businessName: 'Loja Demo',
    })
    .returning()
    .get();

  console.log(`User created: ${user.email}`);

  // Create batch
  const batch = db
    .insert(uploadBatches)
    .values({
      userId: user.id,
      fileName: 'vendas-demo.csv',
      totalRecords: 41,
      totalRevenue: 1983.10,
      status: 'completed',
    })
    .returning()
    .get();

  // Demo sales data
  const demoSales = [
    { date: '2026-02-05', product: 'Camiseta Básica', amount: 59.90 },
    { date: '2026-02-05', product: 'Caneca Personalizada', amount: 34.90 },
    { date: '2026-02-05', product: 'Adesivo Pack', amount: 12.90 },
    { date: '2026-02-06', product: 'Camiseta Básica', amount: 59.90 },
    { date: '2026-02-06', product: 'Boné Bordado', amount: 79.90 },
    { date: '2026-02-06', product: 'Caneca Personalizada', amount: 34.90 },
    { date: '2026-02-06', product: 'Poster A3', amount: 29.90 },
    { date: '2026-02-07', product: 'Camiseta Básica', amount: 59.90 },
    { date: '2026-02-07', product: 'Camiseta Básica', amount: 59.90 },
    { date: '2026-02-07', product: 'Ecobag', amount: 24.90 },
    { date: '2026-02-08', product: 'Boné Bordado', amount: 79.90 },
    { date: '2026-02-08', product: 'Caneca Personalizada', amount: 34.90 },
    { date: '2026-02-08', product: 'Poster A3', amount: 29.90 },
    { date: '2026-02-08', product: 'Camiseta Básica', amount: 59.90 },
    { date: '2026-02-09', product: 'Ecobag', amount: 24.90 },
    { date: '2026-02-09', product: 'Adesivo Pack', amount: 12.90 },
    { date: '2026-02-09', product: 'Camiseta Básica', amount: 59.90 },
    { date: '2026-02-10', product: 'Caneca Personalizada', amount: 34.90 },
    { date: '2026-02-10', product: 'Boné Bordado', amount: 79.90 },
    { date: '2026-02-10', product: 'Camiseta Básica', amount: 59.90 },
    { date: '2026-02-11', product: 'Poster A3', amount: 29.90 },
    { date: '2026-02-11', product: 'Camiseta Básica', amount: 59.90 },
    { date: '2026-02-11', product: 'Caneca Personalizada', amount: 34.90 },
    { date: '2026-02-12', product: 'Boné Bordado', amount: 79.90 },
    { date: '2026-02-12', product: 'Ecobag', amount: 24.90 },
    { date: '2026-02-12', product: 'Camiseta Básica', amount: 59.90 },
    { date: '2026-02-13', product: 'Camiseta Básica', amount: 59.90 },
    { date: '2026-02-13', product: 'Caneca Personalizada', amount: 34.90 },
    { date: '2026-02-13', product: 'Adesivo Pack', amount: 12.90 },
    { date: '2026-02-14', product: 'Camiseta Básica', amount: 59.90 },
    { date: '2026-02-14', product: 'Boné Bordado', amount: 79.90 },
    { date: '2026-02-14', product: 'Poster A3', amount: 29.90 },
    { date: '2026-02-14', product: 'Caneca Personalizada', amount: 34.90 },
    { date: '2026-02-15', product: 'Camiseta Básica', amount: 59.90 },
    { date: '2026-02-15', product: 'Ecobag', amount: 24.90 },
    { date: '2026-02-16', product: 'Caneca Personalizada', amount: 34.90 },
    { date: '2026-02-16', product: 'Camiseta Básica', amount: 59.90 },
    { date: '2026-02-16', product: 'Boné Bordado', amount: 79.90 },
    { date: '2026-02-17', product: 'Adesivo Pack', amount: 12.90 },
    { date: '2026-02-17', product: 'Camiseta Básica', amount: 59.90 },
    { date: '2026-02-17', product: 'Poster A3', amount: 29.90 },
  ];

  db.insert(sales)
    .values(
      demoSales.map((s) => ({
        userId: user.id,
        saleDate: s.date,
        productName: s.product,
        amount: s.amount,
        batchId: batch.id,
      }))
    )
    .run();

  console.log(`${demoSales.length} sales inserted.`);
  console.log('Seed complete!');
  console.log('Login: demo@bizmetrics.com / Demo1234');
}

seed().catch(console.error);
