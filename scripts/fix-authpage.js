const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'components', 'auth', 'AuthPage.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Normalize mixed line endings so we can work with them
const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

// Remove forceRedirectUrl from SignUp block only - leave SignIn intact
// Strategy: replace the entire widget section
const oldWidget = `          <div className="auth-clerk-widget">
            {isSignUp ? (
              <SignUp
                appearance={authAppearance}
                forceRedirectUrl="/app/overview"
                fallbackRedirectUrl="/app/overview"
                path="/sign-up"
                routing="path"
                signInUrl="/sign-in"
              />
            ) : (
              <SignIn
                appearance={authAppearance}
                forceRedirectUrl="/app/overview"
                fallbackRedirectUrl="/app/overview"
                path="/sign-in"
                routing="path"
                signUpUrl="/sign-up"
              />
            )}
          </div>`;

const newWidget = `          <div className="auth-clerk-widget">
            {isSignUp ? (
              <SignUp
                appearance={authAppearance}
                fallbackRedirectUrl="/app/overview"
                path="/sign-up"
                routing="path"
                signInUrl="/sign-in"
              />
            ) : (
              <SignIn
                appearance={authAppearance}
                forceRedirectUrl="/app/overview"
                fallbackRedirectUrl="/app/overview"
                path="/sign-in"
                routing="path"
                signUpUrl="/sign-up"
              />
            )}
          </div>`;

if (normalized.includes(oldWidget)) {
  const fixed = normalized.replace(oldWidget, newWidget);
  // Restore CRLF for consistency with original file
  fs.writeFileSync(filePath, fixed.replace(/\n/g, '\r\n'), 'utf8');
  console.log('SUCCESS: Fixed AuthPage.tsx widget section');
} else {
  // Fallback: just strip the forceRedirectUrl line from SignUp using regex
  const signUpFixed = normalized.replace(
    /(<SignUp[\s\S]*?)forceRedirectUrl="\/app\/overview"\n(\s*fallbackRedirectUrl)/,
    '$1$2'
  );
  if (signUpFixed !== normalized) {
    fs.writeFileSync(filePath, signUpFixed.replace(/\n/g, '\r\n'), 'utf8');
    console.log('SUCCESS: Stripped forceRedirectUrl from SignUp via regex');
  } else {
    console.log('INFO: No change needed or pattern not found - dumping widget section:');
    const start = normalized.indexOf('auth-clerk-widget');
    console.log(JSON.stringify(normalized.slice(start - 10, start + 600)));
  }
}

