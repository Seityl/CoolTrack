from setuptools import setup, find_packages

with open('requirements.txt') as f:
    install_requires = f.read().strip().split('\n')

install_requires = [req for req in install_requires if req and not req.startswith('#')]

setup(
    name='cooltrack',
    version='0.0.1',
    description='Refrigeration monitoring and alerts.',
    author='Cogent Media',
    author_email='dev@cogentmedia.co',
    packages=find_packages(),
    zip_safe=False,
    include_package_data=True,
    install_requires=install_requires
)