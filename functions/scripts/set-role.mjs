/**
 * Asigna un custom claim de rol en Firebase Auth (Admin SDK 14.5.1).
 *
 * Uso (desde la raíz del repo):
 *   node functions/scripts/set-role.mjs --uid <UID> --role <admin|planner|technician|viewer> --project <PROJECT_ID>
 *
 * Autenticación: Application Default Credentials (ADC).
 * No imprime secretos. No commitear claves de cuenta de servicio.
 */
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const ALLOWED_ROLES = Object.freeze(['admin', 'planner', 'technician', 'viewer']);

function usage() {
  return [
    'Uso:',
    '  node functions/scripts/set-role.mjs --uid <UID> --role <admin|planner|technician|viewer> --project <PROJECT_ID>',
    '',
    'También se aceptan argumentos posicionales: <uid> <role> <project>',
    'Roles permitidos: ' + ALLOWED_ROLES.join(', '),
  ].join('\n');
}

function parseArgs(argv) {
  const out = { uid: '', role: '', project: '' };
  const positional = [];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') {
      console.log(usage());
      process.exit(0);
    }
    if (arg === '--uid' || arg === '--role' || arg === '--project') {
      const value = argv[i + 1];
      if (!value || value.startsWith('--')) {
        throw new Error('Falta el valor de ' + arg + '.\n\n' + usage());
      }
      if (arg === '--uid') out.uid = value;
      if (arg === '--role') out.role = value;
      if (arg === '--project') out.project = value;
      i++;
      continue;
    }
    if (arg.startsWith('--')) {
      throw new Error('Argumento no reconocido: ' + arg + '.\n\n' + usage());
    }
    positional.push(arg);
  }

  if (!out.uid && positional[0]) out.uid = positional[0];
  if (!out.role && positional[1]) out.role = positional[1];
  if (!out.project && positional[2]) out.project = positional[2];

  return out;
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

let args;
try {
  args = parseArgs(process.argv.slice(2));
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}

if (!args.uid || !args.role || !args.project) {
  fail('Debes indicar --uid, --role y --project.\n\n' + usage());
}

if (!ALLOWED_ROLES.includes(args.role)) {
  fail(
    'Rol no válido: ' + JSON.stringify(args.role) + '. Permitidos: ' + ALLOWED_ROLES.join(', ') + '.'
  );
}

const app = initializeApp({ projectId: args.project });
const auth = getAuth(app);

try {
  await auth.setCustomUserClaims(args.uid, { role: args.role });
  const user = await auth.getUser(args.uid);
  console.log('Proyecto: ' + args.project);
  console.log('UID: ' + user.uid);
  if (user.email) {
    console.log('Email: ' + user.email);
  }
  console.log('Custom claims leídos:');
  console.log(JSON.stringify(user.customClaims ?? {}, null, 2));
  console.log('Listo. Cierra sesión en la app y vuelve a entrar para que el ID token incorpore el claim.');
} catch (error) {
  const err = error instanceof Error ? error : new Error(String(error));
  console.error('No se pudo asignar el custom claim.');
  console.error(err.message);
  console.error(
    'Comprueba que hay Application Default Credentials (gcloud auth application-default login) o que GOOGLE_APPLICATION_CREDENTIALS apunta a una clave de cuenta de servicio fuera del repo, y que esa identidad tiene permiso de administrador de Authentication en el proyecto.'
  );
  process.exit(1);
}