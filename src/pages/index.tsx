import { GetStaticProps } from 'next';
import Link from 'next/link';

import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useEffect, useState } from 'react';
import { RichText } from 'prismic-dom';
import { FiUser, FiCalendar } from 'react-icons/fi';
import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const [posts, setPosts] = useState<Post[]>([]);
  const [nextPage, setNextPage] = useState(null);

  useEffect(() => {
    setPosts(postsPagination.results);
    setNextPage(postsPagination.next_page);
  }, [postsPagination]);

  async function handleLoadPages(): Promise<void> {
    const { results, next_page } = await (await fetch(nextPage)).json();
    setNextPage(next_page);

    results.map((post: Post): void => {
      setPosts(oldPageState => [...oldPageState, post]);
      return null;
    });
  }

  return (
    <main className={commonStyles.container}>
      <div className={commonStyles.content}>
        <img className={styles.logo} src="/Logo.svg" alt="logo" />
        <div className={styles.posts}>
          {posts.map(post => {
            const date = format(
              new Date(post.first_publication_date),
              'dd MMM yyyy',
              { locale: ptBR }
            );
            return (
              <Link href={`/post/${post.uid}`} key={post.uid}>
                <a>
                  <strong>{RichText.asText(post.data.title)}</strong>
                  <p>{RichText.asText(post.data.subtitle)}</p>
                  <div>
                    <span>
                      <FiCalendar size="20px" color="#bbb" />
                      <p>{date}</p>
                    </span>
                    <span>
                      <FiUser size="20px" color="#bbb" />
                      <p>{RichText.asText(post.data.author)}</p>
                    </span>
                  </div>
                </a>
              </Link>
            );
          })}
        </div>
        {nextPage && (
          <button
            type="button"
            onClick={handleLoadPages}
            className={styles.nextPosts}
          >
            <p>Carregar mais posts</p>
          </button>
        )}
      </div>
    </main>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
      pageSize: 1,
    }
  );

  return { props: { postsPagination: postsResponse } };
};
