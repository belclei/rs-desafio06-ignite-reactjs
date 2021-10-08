import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import Prismic from '@prismicio/client';
import { useCallback } from 'react';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import PrismicDOM, { RichText } from 'prismic-dom';
import Header from '../../components/Header';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  const {
    first_publication_date,
    data: { title, banner, author, content },
  } = post;

  const router = useRouter();

  const estimatedTimeToRead = useCallback(() => {
    const contentArray = content.reduce((acc, cur) => {
      return [...acc, ...cur.body];
    }, []);
    const allBodyString = PrismicDOM.RichText.asText(contentArray);
    const time = Math.ceil(allBodyString.split(' ').length / 200);
    return time;
  }, [content]);

  if (router.isFallback) {
    return <div>Carregando...</div>;
  }
  return (
    <>
      <main className={commonStyles.container}>
        <div className={commonStyles.content}>
          <Header />
        </div>
        <img className={styles.banner} src={banner.url} alt="teste" />
        <div className={commonStyles.content}>
          <article className={styles.article}>
            <h1>{title}</h1>
            <div>
              <span>
                <FiCalendar size="20px" color="#bbb" />
                <p>{first_publication_date}</p>
              </span>
              <span>
                <FiUser size="20px" color="#bbb" />
                <p>{author}</p>
              </span>
              <span>
                <FiClock size="20px" color="#bbb" />
                <p>{estimatedTimeToRead()} min</p>
              </span>
            </div>
            {content.map(data => {
              return (
                <section key={data.heading}>
                  <h1>{RichText.asText(data.heading)}</h1>
                  <div
                    className={styles.body}
                    dangerouslySetInnerHTML={{
                      __html: RichText.asHtml(data.body),
                    }}
                  />
                </section>
              );
            })}
          </article>
        </div>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.uid'],
    }
  );
  const paths = posts.results.map(post => {
    return {
      params: { slug: post.uid },
    };
  });

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const prismic = getPrismicClient();
  const parseUid = String(params.slug);
  const response = await prismic.getByUID('posts', parseUid, {});
  const {
    first_publication_date,
    data: { title, author, content, banner },
  }: Post = response;

  const formattedTitle = RichText.asText(title);
  const formattedAuthor = RichText.asText(author);
  const formattedDate = format(
    new Date(first_publication_date),
    'dd MMM yyyy',
    {
      locale: ptBR,
    }
  );

  return {
    props: {
      post: {
        first_publication_date: formattedDate,
        data: {
          title: formattedTitle,
          author: formattedAuthor,
          content,
          banner,
        },
      },
    },
  };
};
