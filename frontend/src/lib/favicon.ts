// Utility to dynamically change the favicon based on the current stage

export const setFavicon = (stage: 1 | 2 | 3) => {
    const faviconPath = `/favicon${stage}.png`;

    // Find existing favicon link or create one
    let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;

    if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        link.type = 'image/png';
        document.head.appendChild(link);
    }

    link.href = faviconPath;
};
