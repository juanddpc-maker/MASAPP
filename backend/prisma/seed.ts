import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('admin123', 10);

  const admin = await prisma.usuario.upsert({
    where: { correo: 'admin@escuela.local' },
    update: {},
    create: {
      nombre: 'Administrador Principal',
      correo: 'admin@escuela.local',
      passwordHash,
      rol: 'ADMINISTRADOR',
    },
  });
  console.log('Usuario admin creado:', admin.correo, '(password: admin123)');

  let disciplina = await prisma.disciplina.findUnique({ where: { nombre: 'Karate' } });
  if (!disciplina) {
    disciplina = await prisma.disciplina.create({ data: { nombre: 'Karate' } });
  }
  console.log('Disciplina Karate cargada');

  const cintasKarate = ['Blanca', 'Amarilla', 'Naranja', 'Verde', 'Azul', 'Marrón', 'Negra'];
  for (let i = 0; i < cintasKarate.length; i++) {
    const existente = await prisma.cinta.findFirst({ where: { nombre: cintasKarate[i], disciplinaId: disciplina.id } });
    if (!existente) {
      await prisma.cinta.create({ data: { nombre: cintasKarate[i], orden: i, disciplinaId: disciplina.id } });
    }
  }
  console.log('Catálogo de cintas de Karate cargado');

  let horario = await prisma.horario.findFirst({ where: { disciplinaId: disciplina.id, nombre: 'Grupo A' } });
  if (!horario) {
    horario = await prisma.horario.create({
      data: {
        disciplinaId: disciplina.id,
        nombre: 'Grupo A',
        dias: ['LUNES', 'MIERCOLES'],
        horaInicio: '17:00',
        horaFin: '18:00',
      },
    });
  }
  console.log('Horario de ejemplo cargado');

  // Tutor y alumno de prueba con UUIDs reales generados por Prisma (no IDs falsos)
  let tutor = await prisma.tutor.findUnique({ where: { correo: 'maria.perez@ejemplo.com' } });
  if (!tutor) {
    tutor = await prisma.tutor.create({
      data: { nombre: 'María Pérez', telefono: '664-123-4567', correo: 'maria.perez@ejemplo.com', relacion: 'Madre' },
    });
  }

  const cintaBase = await prisma.cinta.findFirst({ where: { disciplinaId: disciplina.id }, orderBy: { orden: 'asc' } });

  const alumnoExistente = await prisma.alumno.findFirst({ where: { nombreCompleto: 'Carlos Pérez' } });
  if (!alumnoExistente) {
    await prisma.alumno.create({
      data: {
        nombreCompleto: 'Carlos Pérez',
        fechaNacimiento: new Date('2015-03-10'),
        genero: 'MASCULINO',
        tallaCinta: '2',
        cintaActualId: cintaBase?.id,
        horarios: { create: { horarioId: horario.id, esPrincipal: true } },
        tutores: { create: { tutorId: tutor.id, esPrincipal: true } },
      },
    });
  }
  console.log('Tutor y alumno de prueba creados');

  const escuela = await prisma.escuela.findFirst();
  if (!escuela) {
    await prisma.escuela.create({ data: { nombre: 'Mi escuela de artes marciales' } });
  }
  console.log('Configuración de escuela inicial creada');

  const categoriasDefault = ['Uniforme', 'Cascos', 'Espinilleras', 'Guantes'];
  for (const nombre of categoriasDefault) {
    const existe = await prisma.categoria.findUnique({ where: { nombre } });
    if (!existe) await prisma.categoria.create({ data: { nombre } });
  }
  console.log('Categorías de inventario cargadas');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
