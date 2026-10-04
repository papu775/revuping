import { emailTemplate } from './email-template';
describe('team invitation security email', () => {
  it('escapes untrusted names/business text and retains a fragment-only secret link', () => {
    const link = `https://app.example.test/join-team#token=${'a'.repeat(43)}`;
    const mail = emailTemplate(false, link, {
      name: '<img src=x onerror=alert(1)>',
      business: 'Studio <script>evil</script>',
    });
    expect(mail.html).not.toContain('<script>evil');
    expect(mail.html).not.toContain('<img src=x');
    expect(mail.html).toContain('&lt;script&gt;evil&lt;/script&gt;');
    expect(mail.text).toContain(link);
    expect(mail.text).toContain('7 days');
    expect(mail.text).toContain('most recent invitation link');
  });
});
