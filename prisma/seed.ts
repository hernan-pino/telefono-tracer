import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Stores
  const tiendaCentro = await prisma.store.upsert({
    where: { id: 'store-centro' },
    update: {},
    create: { id: 'store-centro', name: 'Tienda Centro', address: 'Av. Principal 100', city: 'Ciudad de México' },
  })
  const tiendaNorte = await prisma.store.upsert({
    where: { id: 'store-norte' },
    update: {},
    create: { id: 'store-norte', name: 'Tienda Norte', address: 'Blvd. Norte 250', city: 'Ciudad de México' },
  })
  const tiendaSur = await prisma.store.upsert({
    where: { id: 'store-sur' },
    update: {},
    create: { id: 'store-sur', name: 'Tienda Sur', address: 'Calle Sur 45', city: 'Ciudad de México' },
  })

  // Users
  const supHash = await bcrypt.hash('supervisor123', 10)
  const mercHash = await bcrypt.hash('merchandiser123', 10)

  await prisma.user.upsert({
    where: { email: 'supervisor@vivo.com' },
    update: {},
    create: {
      id: 'user-supervisor',
      name: 'Carlos Supervisor',
      email: 'supervisor@vivo.com',
      passwordHash: supHash,
      role: 'SUPERVISOR',
    },
  })
  await prisma.user.upsert({
    where: { email: 'merch.centro@vivo.com' },
    update: {},
    create: {
      id: 'user-merch-centro',
      name: 'Ana Merchandiser Centro',
      email: 'merch.centro@vivo.com',
      passwordHash: mercHash,
      role: 'MERCHANDISER',
      storeId: tiendaCentro.id,
    },
  })
  await prisma.user.upsert({
    where: { email: 'merch.norte@vivo.com' },
    update: {},
    create: {
      id: 'user-merch-norte',
      name: 'Luis Merchandiser Norte',
      email: 'merch.norte@vivo.com',
      passwordHash: mercHash,
      role: 'MERCHANDISER',
      storeId: tiendaNorte.id,
    },
  })
  await prisma.user.upsert({
    where: { email: 'merch.sur@vivo.com' },
    update: {},
    create: {
      id: 'user-merch-sur',
      name: 'María Merchandiser Sur',
      email: 'merch.sur@vivo.com',
      passwordHash: mercHash,
      role: 'MERCHANDISER',
      storeId: tiendaSur.id,
    },
  })

  // Samples
  const samplesData = [
    { id: 'sample-1', brand: 'Vivo', model: 'Y17s', color: 'Negro', serialNumber: 'SN-VV-001', imei: '351234560000001', currentStoreId: tiendaCentro.id },
    { id: 'sample-2', brand: 'Vivo', model: 'Y17s', color: 'Azul', serialNumber: 'SN-VV-002', imei: '351234560000002', currentStoreId: tiendaCentro.id },
    { id: 'sample-3', brand: 'Vivo', model: 'V29e', color: 'Dorado', serialNumber: 'SN-VV-003', imei: '351234560000003', currentStoreId: tiendaNorte.id },
    { id: 'sample-4', brand: 'Vivo', model: 'V29e', color: 'Negro', serialNumber: 'SN-VV-004', imei: '351234560000004', currentStoreId: tiendaNorte.id },
    { id: 'sample-5', brand: 'Vivo', model: 'X90', color: 'Plata', serialNumber: 'SN-VV-005', imei: '351234560000005', currentStoreId: tiendaSur.id },
  ]

  for (const s of samplesData) {
    await prisma.sample.upsert({
      where: { id: s.id },
      update: {},
      create: { ...s, status: 'ACTIVE' },
    })
  }

  console.log('✅ Seed completado')
  console.log('  Supervisor: supervisor@vivo.com / supervisor123')
  console.log('  Merchandiser Centro: merch.centro@vivo.com / merchandiser123')
  console.log('  Merchandiser Norte:  merch.norte@vivo.com / merchandiser123')
  console.log('  Merchandiser Sur:    merch.sur@vivo.com / merchandiser123')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
