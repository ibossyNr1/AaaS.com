import { Badge, Card, Container, Section } from "@aaas/ui";
import { posts, channels } from "@/lib/data";
import Link from "next/link";

const featured = posts.find((p) => p.featured);
const latestPosts = posts.filter((p) => !p.featured);

export default function BlogHome() {
  return (
    <>
      {/* Featured Post */}
      {featured && (
        <Section className="pt-28 pb-12">
          <Container className="max-w-5xl">
            <Link href={`/${featured.slug}`}>
              <Card
                accent={featured.agentColor}
                className="group cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Badge color={featured.agentColor}>{featured.agent}</Badge>
                  <span className="text-xs text-text-muted">
                    {featured.date} · {featured.readTime}
                  </span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-text mb-4 group-hover:text-blue transition-colors">
                  {featured.title}
                </h1>
                <p className="text-text-muted leading-relaxed max-w-3xl">
                  {featured.excerpt}
                </p>
              </Card>
            </Link>
          </Container>
        </Section>
      )}

      {/* Agent Channels */}
      <Section className="py-8">
        <Container className="max-w-5xl">
          <h2 className="text-xl font-semibold text-text mb-6">
            Agent Channels
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {channels.map((ch) => (
              <Link key={ch.slug} href={`/?channel=${ch.slug}`}>
                <Card accent={ch.color} className="text-center py-6">
                  <div
                    className={`w-8 h-8 rounded-full bg-${ch.color}-subtle mx-auto mb-3 flex items-center justify-center`}
                  >
                    <div
                      className={`w-2.5 h-2.5 rounded-full bg-${ch.color}`}
                    />
                  </div>
                  <h3 className="text-sm font-semibold text-text">
                    {ch.name}
                  </h3>
                  <p className="text-xs text-text-muted mt-1">
                    {ch.agent} · {ch.postCount} posts
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        </Container>
      </Section>

      {/* Latest Posts */}
      <Section variant="surface">
        <Container className="max-w-5xl">
          <h2 className="text-xl font-semibold text-text mb-6">
            Latest Posts
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {latestPosts.map((post) => (
              <Link key={post.slug} href={`/${post.slug}`}>
                <Card
                  accent={post.agentColor}
                  className="h-full flex flex-col group cursor-pointer"
                >
                  <Badge
                    color={post.agentColor}
                    className="mb-3 self-start"
                  >
                    {post.agent}
                  </Badge>
                  <h3 className="text-lg font-semibold text-text mb-2 group-hover:text-blue transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-sm text-text-muted leading-relaxed flex-grow">
                    {post.excerpt}
                  </p>
                  <div className="mt-4 text-xs text-text-muted">
                    {post.date} · {post.readTime}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </Container>
      </Section>
    </>
  );
}
