const providerLabels: Record<string, string> = {
  "google.com": "Google",
  "apple.com": "Apple",
  password: "email and password",
};

export function getReadableProviderName(method: string) {
  return providerLabels[method] ?? method;
}

export function describeProviderConflict(methods: string[]) {
  if (methods.length === 0) {
    return "This email is already linked to another sign-in method. Sign in with the original provider to continue.";
  }

  if (methods.length === 1) {
    return `This account already exists. Sign in with ${getReadableProviderName(methods[0])} to continue.`;
  }

  const labels = methods.map(getReadableProviderName);
  return `This account already exists. Sign in with one of these providers instead: ${labels.join(", ")}.`;
}
