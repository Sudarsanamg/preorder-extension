import {
  SkeletonPage,
  Layout,
  Card,
  SkeletonBodyText,
  TextContainer,
  SkeletonDisplayText,
} from '@shopify/polaris';
import React from 'react';

export default function PreorderSettingsSkeleton() {
  return (
    <SkeletonPage primaryAction>
      <Layout>
        {/* Main section */}
        <Layout.Section>
          {/* Preorder campaigns card */}
          <Card >
            <SkeletonDisplayText size="small" />
            <SkeletonBodyText lines={4} />
          </Card>

          {/* General settings card */}
          <Card >
            <TextContainer>
              <SkeletonDisplayText size="small" />
              <SkeletonBodyText lines={2} />
            </TextContainer>
          </Card>

          {/* Notifications card */}
          <Card >
            <TextContainer>
              <SkeletonDisplayText size="small" />
              <SkeletonBodyText lines={6} />
            </TextContainer>
          </Card>
        </Layout.Section>

        {/* Right sidebar section */}
        <Layout.Section >
          {/* Example side card */}
          <Card >
            <TextContainer>
              <SkeletonDisplayText size="small" />
              <SkeletonBodyText lines={3} />
            </TextContainer>
          </Card>

          <Card  >
            <TextContainer>
              <SkeletonDisplayText size="small" />
              <SkeletonBodyText lines={2} />
            </TextContainer>
          </Card>
        </Layout.Section>
      </Layout>
    </SkeletonPage>
  );
}
