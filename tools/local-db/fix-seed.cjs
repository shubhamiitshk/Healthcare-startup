const { Client } = require('pg');
(async () => {
  const c = new Client({ host:'127.0.0.1', port:5433, user:'catchq', password:'catchq', database:'catchq' });
  await c.connect();
  const t = await c.query(`SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name`);
  console.log('TABLES:', t.rows.map(r=>r.table_name).join(', '));
  await c.query(`INSERT INTO clinics (id,name,address,phone,email) VALUES ('your-clinic-id','Demo Clinic','Local Test Lane','0000000000','demo@catchq.local') ON CONFLICT DO NOTHING`);
  await c.query(`INSERT INTO wards (clinic_id,name,ward_type,capacity,floor) VALUES ('your-clinic-id','ICU','icu',8,1),('your-clinic-id','General Ward A','general',10,1),('your-clinic-id','Emergency','emergency',6,0),('your-clinic-id','Maternity','maternity',6,2),('your-clinic-id','Pediatric','pediatric',6,2) ON CONFLICT DO NOTHING`);
  const w = await c.query(`SELECT count(*)::int AS n FROM wards`);
  console.log('WARDS SEEDED:', w.rows[0].n);
  await c.end();
})().catch(e=>{console.error(e.message);process.exit(1)});
