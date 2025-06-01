import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';

const Container = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  align-items: center;
  background-color: #f9f5e9;
  padding: 20px;
  border-radius: 8px;
  margin: 20px 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const FilterGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 200px;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const Label = styled.label`
  font-weight: 600;
  color: #5c3c10;
  font-size: 0.95rem;
  min-width: 80px;
`;

const Select = styled.select`
  flex: 1;
  padding: 10px;
  border-radius: 4px;
  border: 1px solid #e0c9a6;
  background-color: #fff;
  font-family: 'Merriweather', serif;
  font-size: 0.95rem;
  color: #3a3a3a;
  cursor: pointer;
  min-width: 150px;

  &:focus {
    outline: none;
    border-color: #d4a017;
    box-shadow: 0 0 0 2px rgba(212, 160, 23, 0.2);
  }

  @media (max-width: 480px) {
    width: 100%;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;

  @media (max-width: 768px) {
    width: 100%;
    margin-top: 10px;
  }
`;

const FilterButton = styled.button`
  background-color: #5c3c10;
  color: #fff;
  border: none;
  border-radius: 4px;
  padding: 10px 20px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;

  &:hover {
    background-color: #6e4a1f;
    transform: translateY(-1px);
  }

  @media (max-width: 768px) {
    flex: 1;
  }
`;

const ResetButton = styled.button`
  background-color: transparent;
  color: #5c3c10;
  border: 1px solid #5c3c10;
  border-radius: 4px;
  padding: 10px 20px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;

  &:hover {
    background-color: rgba(92, 60, 16, 0.1);
  }

  @media (max-width: 768px) {
    flex: 1;
  }
`;

function FilterBar() {
  const [region, setRegion] = useState('');
  const [genre, setGenre] = useState('');
  const [ageGroup, setAgeGroup] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    setRegion(query.get('region') || '');
    setGenre(query.get('genre') || '');
    setAgeGroup(query.get('ageGroup') || '');
  }, [location.search]);

  const handleFilter = () => {
    const query = new URLSearchParams();
    if (region) query.set('region', region);
    if (genre) query.set('genre', genre);
    if (ageGroup) query.set('ageGroup', ageGroup);
    navigate(`/?${query.toString()}`);
  };

  const handleReset = () => {
    setRegion('');
    setGenre('');
    setAgeGroup('');
    navigate('/');
  };

  return (
    <Container>
      <FilterGroup>
        <Label>Region:</Label>
        <Select onChange={(e) => setRegion(e.target.value)} value={region}>
          <option value="">All Regions</option>
          <option value="Afghanistan">Afghanistan</option>
          <option value="Albania">Albania</option>
          <option value="Algeria">Algeria</option>
          <option value="Andorra">Andorra</option>
          <option value="Angola">Angola</option>
          <option value="Antigua and Barbuda">Antigua and Barbuda</option>
          <option value="Argentina">Argentina</option>
          <option value="Armenia">Armenia</option>
          <option value="Australia">Australia</option>
          <option value="Austria">Austria</option>
          <option value="Azerbaijan">Azerbaijan</option>
          <option value="Bahamas">Bahamas</option>
          <option value="Bahrain">Bahrain</option>
          <option value="Bangladesh">Bangladesh</option>
          <option value="Barbados">Barbados</option>
          <option value="Belarus">Belarus</option>
          <option value="Belgium">Belgium</option>
          <option value="Belize">Belize</option>
          <option value="Benin">Benin</option>
          <option value="Bhutan">Bhutan</option>
          <option value="Bolivia">Bolivia</option>
          <option value="Bosnia and Herzegovina">Bosnia and Herzegovina</option>
          <option value="Botswana">Botswana</option>
          <option value="Brazil">Brazil</option>
          <option value="Brunei Darussalam">Brunei Darussalam</option>
          <option value="Bulgaria">Bulgaria</option>
          <option value="Burkina Faso">Burkina Faso</option>
          <option value="Burundi">Burundi</option>
          <option value="Cabo Verde">Cabo Verde</option>
          <option value="Cambodia">Cambodia</option>
          <option value="Cameroon">Cameroon</option>
          <option value="Canada">Canada</option>
          <option value="Central African Republic">Central African Republic</option>
          <option value="Chad">Chad</option>
          <option value="Chile">Chile</option>
          <option value="China">China</option>
          <option value="Colombia">Colombia</option>
          <option value="Comoros">Comoros</option>
          <option value="Congo (Congo-Brazzaville)">Congo (Congo-Brazzaville)</option>
          <option value="Congo (Democratic Republic of the)">Congo (Democratic Republic of the)</option>
          <option value="Costa Rica">Costa Rica</option>
          <option value="Croatia">Croatia</option>
          <option value="Cuba">Cuba</option>
          <option value="Cyprus">Cyprus</option>
          <option value="Czech Republic (Czechia)">Czech Republic (Czechia)</option>
          <option value="Denmark">Denmark</option>
          <option value="Djibouti">Djibouti</option>
          <option value="Dominica">Dominica</option>
          <option value="Dominican Republic">Dominican Republic</option>
          <option value="Ecuador">Ecuador</option>
          <option value="Egypt">Egypt</option>
          <option value="El Salvador">El Salvador</option>
          <option value="Equatorial Guinea">Equatorial Guinea</option>
          <option value="Eritrea">Eritrea</option>
          <option value="Estonia">Estonia</option>
          <option value="Eswatini (fmr. 'Swaziland')">Eswatini (fmr. 'Swaziland')</option>
          <option value="Ethiopia">Ethiopia</option>
          <option value="Fiji">Fiji</option>
          <option value="Finland">Finland</option>
          <option value="France">France</option>
          <option value="Gabon">Gabon</option>
          <option value="Gambia">Gambia</option>
          <option value="Georgia">Georgia</option>
          <option value="Germany">Germany</option>
          <option value="Ghana">Ghana</option>
          <option value="Greece">Greece</option>
          <option value="Grenada">Grenada</option>
          <option value="Guatemala">Guatemala</option>
          <option value="Guinea">Guinea</option>
          <option value="Guinea-Bissau">Guinea-Bissau</option>
          <option value="Guyana">Guyana</option>
          <option value="Haiti">Haiti</option>
          <option value="Honduras">Honduras</option>
          <option value="Hungary">Hungary</option>
          <option value="Iceland">Iceland</option>
          <option value="India">India</option>
          <option value="Indonesia">Indonesia</option>
          <option value="Iran">Iran</option>
          <option value="Iraq">Iraq</option>
          <option value="Ireland">Ireland</option>
          <option value="Israel">Israel</option>
          <option value="Italy">Italy</option>
          <option value="Jamaica">Jamaica</option>
          <option value="Japan">Japan</option>
          <option value="Jordan">Jordan</option>
          <option value="Kazakhstan">Kazakhstan</option>
          <option value="Kenya">Kenya</option>
          <option value="Kiribati">Kiribati</option>
          <option value="Korea (North)">Korea (North)</option>
          <option value="Korea (South)">Korea (South)</option>
          <option value="Kuwait">Kuwait</option>
          <option value="Kyrgyzstan">Kyrgyzstan</option>
          <option value="Laos">Laos</option>
          <option value="Latvia">Latvia</option>
          <option value="Lebanon">Lebanon</option>
          <option value="Lesotho">Lesotho</option>
          <option value="Liberia">Liberia</option>
          <option value="Libya">Libya</option>
          <option value="Liechtenstein">Liechtenstein</option>
          <option value="Lithuania">Lithuania</option>
          <option value="Luxembourg">Luxembourg</option>
          <option value="Madagascar">Madagascar</option>
          <option value="Malawi">Malawi</option>
          <option value="Malaysia">Malaysia</option>
          <option value="Maldives">Maldives</option>
          <option value="Mali">Mali</option>
          <option value="Malta">Malta</option>
          <option value="Marshall Islands">Marshall Islands</option>
          <option value="Mauritania">Mauritania</option>
          <option value="Mauritius">Mauritius</option>
          <option value="Mexico">Mexico</option>
          <option value="Micronesia">Micronesia</option>
          <option value="Moldova">Moldova</option>
          <option value="Monaco">Monaco</option>
          <option value="Mongolia">Mongolia</option>
          <option value="Montenegro">Montenegro</option>
          <option value="Morocco">Morocco</option>
          <option value="Mozambique">Mozambique</option>
          <option value="Myanmar (formerly Burma)">Myanmar (formerly Burma)</option>
          <option value="Namibia">Namibia</option>
          <option value="Nauru">Nauru</option>
          <option value="Nepal">Nepal</option>
          <option value="Netherlands">Netherlands</option>
          <option value="New Zealand">New Zealand</option>
          <option value="Nicaragua">Nicaragua</option>
          <option value="Niger">Niger</option>
        </Select>
      </FilterGroup>

      <FilterGroup>
        <Label>Genre:</Label>
        <Select onChange={(e) => setGenre(e.target.value)} value={genre}>
          <option value="">All Genres</option>
<option value="Fable">Fable</option>
<option value="Myth">Myth</option>
<option value="Legend">Legend</option>
<option value="Fairy Tale">Fairy Tale</option>
<option value="Horror">Horror</option>
<option value="Fantasy">Fantasy</option>
<option value="Adventure">Adventure</option>
<option value="Mystery">Mystery</option>
<option value="Historical">Historical</option>
<option value="Ghost Story">Ghost Story</option>
<option value="Supernatural">Supernatural</option>
<option value="Tragedy">Tragedy</option>
<option value="Moral Tale">Moral Tale</option>
<option value="Urban Legend">Urban Legend</option>
<option value="Comedy">Comedy</option>
<option value="Parable">Parable</option>
<option value="Epic">Epic</option>
<option value="Romance">Romance</option>

        </Select>
      </FilterGroup>

      <FilterGroup>
        <Label>Age Group:</Label>
        <Select onChange={(e) => setAgeGroup(e.target.value)} value={ageGroup}>
          <option value="">All Ages</option>
          <option value="Kids">Kids</option>
          <option value="Teens">Teens</option>
          <option value="Adults">Adults</option>
        </Select>
      </FilterGroup>

      <ButtonGroup>
        <FilterButton onClick={handleFilter}>Apply Filters</FilterButton>
        <ResetButton onClick={handleReset}>Reset</ResetButton>
      </ButtonGroup>
    </Container>
  );
}

export default FilterBar;